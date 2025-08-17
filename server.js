

// All requires at the very top
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express(); // <-- This must come before any app.post, app.use, etc.

const USERS_FILE = path.join(__dirname, 'users.json');

// --- USER LOGIN ENDPOINT ---
app.post('/login', async (req, res) => {
  console.log('LOGIN ENDPOINT HIT');
  console.log('req.headers:', req.headers);
  console.log('req.body:', req.body);
  if (!req.body) {
    return res.status(400).json({ error: 'No body received.' });
  }
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE));
  }
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
  res.json({ success: true, username });
});
// --- MENU MANAGEMENT ENDPOINTS ---
const MENU_FILE = path.join(__dirname, 'menu.json');

// Get all menu items
app.get('/menu', (req, res) => {
  let menu = [];
  if (fs.existsSync(MENU_FILE)) {
    menu = JSON.parse(fs.readFileSync(MENU_FILE));
  }
  res.json(menu);
});

// Add a new menu item
app.post('/menu', (req, res) => {
  let menu = [];
  if (fs.existsSync(MENU_FILE)) {
    menu = JSON.parse(fs.readFileSync(MENU_FILE));
  }
  const { username, ...newItem } = req.body;
  newItem.id = Date.now();
  if (username) newItem.lastEditedBy = username;
  menu.push(newItem);
  fs.writeFileSync(MENU_FILE, JSON.stringify(menu, null, 2));
  res.json({ success: true, item: newItem });
});

// Update a menu item by id
app.put('/menu/:id', (req, res) => {
  let menu = [];
  if (fs.existsSync(MENU_FILE)) {
    menu = JSON.parse(fs.readFileSync(MENU_FILE));
  }
  const id = parseInt(req.params.id);
  const idx = menu.findIndex(item => item.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  const { username, ...updateFields } = req.body;
  menu[idx] = { ...menu[idx], ...updateFields };
  if (username) menu[idx].lastEditedBy = username;
  fs.writeFileSync(MENU_FILE, JSON.stringify(menu, null, 2));
  res.json({ success: true, item: menu[idx] });
});

// Delete a menu item by id
app.delete('/menu/:id', (req, res) => {
  let menu = [];
  if (fs.existsSync(MENU_FILE)) {
    menu = JSON.parse(fs.readFileSync(MENU_FILE));
  }
  const id = parseInt(req.params.id);
  const idx = menu.findIndex(item => item.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  const { username } = req.body;
  if (username) menu[idx].lastEditedBy = username;
  const removed = menu.splice(idx, 1);
  fs.writeFileSync(MENU_FILE, JSON.stringify(menu, null, 2));
  res.json({ success: true, item: removed[0] });
});
// Update order status or notes by index
app.post('/update-order', (req, res) => {
  const { index, status, note, username } = req.body;
  if (typeof index !== 'number') {
    return res.status(400).json({ error: 'Order index required.' });
  }
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  }
  if (!orders[index]) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  if (status) orders[index].status = status;
  if (note !== undefined) orders[index].adminNote = note;
  if (username) orders[index].lastEditedBy = username;
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  res.json({ success: true, order: orders[index] });
});
// Simple Stripe Checkout backend for Node.js
// 1. Run: npm install express stripe cors
// 2. Replace 'sk_test_REPLACE_WITH_YOUR_SECRET_KEY' with your Stripe secret key
// 3. Run: node server.js


const stripe = Stripe('sk_test_REPLACE_WITH_YOUR_SECRET_KEY'); // Replace with your real secret key

// Configure nodemailer (replace with your SMTP details)
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // e.g. smtp.gmail.com
  port: 587,
  secure: false,
  auth: {
    user: 'your@email.com',
    pass: 'yourpassword'
  }
});

function sendReceiptEmail(order) {
  if (!order.customerEmail) return;
  let itemsHtml = order.cart.map(item => `<li>${item.name} - £${item.price.toFixed(2)}</li>`).join('');
  let html = `<h2>Thank you for your order!</h2>
    <p><strong>Name:</strong> ${order.customerName || ''}</p>
    <p><strong>Phone:</strong> ${order.customerPhone || ''}</p>
    <p><strong>Order Type:</strong> ${order.orderType || ''}</p>
    <p><strong>Time Slot:</strong> ${order.orderTimeSlot || ''}</p>
    ${(order.orderType === 'delivery') ? `<p><strong>Address:</strong> ${order.customerAddress || ''}</p><p><strong>Postcode:</strong> ${order.customerPostcode || ''}</p>` : ''}
    <ul>${itemsHtml}</ul>
    <p><strong>Total:</strong> £${order.total.toFixed(2)}</p>
    <p>If you have any questions, reply to this email.</p>`;
  transporter.sendMail({
    from: 'your@email.com',
    to: order.customerEmail,
    subject: 'Your Pizza Order Receipt',
    html
  }, (err, info) => {
    if (err) console.error('Email error:', err);
    else console.log('Receipt email sent:', info.response);
  });
}

app.use(cors());
app.use(express.json());

const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Helper to save order
function saveOrder(order) {
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  }
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Helper to count pizzas in a time slot
// Helper to get all time slots in order
function getAllTimeSlots() {
  return [
    '17:00-17:30',
    '17:30-18:00',
    '18:00-18:30',
    '18:30-19:00',
    '19:00-19:30',
    '19:30-20:00',
    '20:00-20:30',
    '20:30-21:00',
    '21:00-21:30',
    '21:30-22:00'
  ];
}

function getPizzaCountForSlot(timeSlot) {
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  }
  let count = 0;
  orders.forEach(order => {
    if (order.orderTimeSlot === timeSlot) {
      order.cart.forEach(item => {
        if (typeof item.name === 'string' && item.name.toLowerCase().includes('pizza')) {
          count++;
        }
      });
    }
  });
  return count;
}

// Helper to check if a multi-slot pizza order can fit, and block slots accordingly
function canFitPizzaOrderInSlots(startSlot, pizzaCount) {
  const slots = getAllTimeSlots();
  const idx = slots.indexOf(startSlot);
  if (idx === -1) return false;
  let pizzasLeft = pizzaCount;
  for (let i = idx; i < slots.length && pizzasLeft > 0; i++) {
    const slotPizzaCount = getPizzaCountForSlot(slots[i]);
    const available = Math.max(0, 8 - slotPizzaCount);
    pizzasLeft -= available;
  }
  return pizzasLeft <= 0;
}

function blockPizzaOrderInSlots(startSlot, pizzaCount) {
  // Returns an array of {slot, count} for how many pizzas to block in each slot
  const slots = getAllTimeSlots();
  const idx = slots.indexOf(startSlot);
  let pizzasLeft = pizzaCount;
  const result = [];
  for (let i = idx; i < slots.length && pizzasLeft > 0; i++) {
    const slotPizzaCount = getPizzaCountForSlot(slots[i]);
    const available = Math.max(0, 8 - slotPizzaCount);
    const toBlock = Math.min(available, pizzasLeft);
    if (toBlock > 0) {
      result.push({ slot: slots[i], count: toBlock });
      pizzasLeft -= toBlock;
    }
  }
  return pizzasLeft <= 0 ? result : null;
}

// Stripe Checkout endpoint
app.post('/create-checkout-session', async (req, res) => {
  const { cart, total, orderType, customerName, customerPhone, customerAddress, customerPostcode, orderTimeSlot, customerEmail } = req.body;
  // Block slot(s) if 8 or more pizzas already ordered, or if this order needs to span slots
  if (orderTimeSlot) {
    let pizzasInOrder = 0;
    cart.forEach(item => {
      if (typeof item.name === 'string' && item.name.toLowerCase().includes('pizza')) pizzasInOrder++;
    });
    if (pizzasInOrder > 8) {
      // Need to span slots
      if (!canFitPizzaOrderInSlots(orderTimeSlot, pizzasInOrder)) {
        return res.status(400).json({ error: 'Not enough space in this and following slots for your pizza order. Please choose another time.' });
      }
    } else {
      const pizzasInSlot = getPizzaCountForSlot(orderTimeSlot);
      if (pizzasInSlot + pizzasInOrder > 8) {
        return res.status(400).json({ error: 'This time slot is full. Please choose another.' });
      }
    }
  }
  try {
    // Save order as 'pending' (will update to 'paid' after payment)
    // If more than 8 pizzas, split the order into multiple slots for blocking
    let pizzasInOrder = 0;
    cart.forEach(item => {
      if (typeof item.name === 'string' && item.name.toLowerCase().includes('pizza')) pizzasInOrder++;
    });
    if (orderTimeSlot && pizzasInOrder > 8) {
      const blocks = blockPizzaOrderInSlots(orderTimeSlot, pizzasInOrder);
      if (!blocks) {
        return res.status(400).json({ error: 'Not enough space in this and following slots for your pizza order. Please choose another time.' });
      }
      // Save a separate order for each slot block, but only the first gets the full order details
      let first = true;
      blocks.forEach(b => {
        const order = {
          cart,
          total,
          method: 'card',
          status: 'pending',
          time: new Date().toISOString(),
          orderType,
          customerName,
          customerPhone,
          customerAddress,
          customerPostcode,
          orderTimeSlot: b.slot,
          pizzasBlocked: b.count,
          isMainOrder: first,
          customerEmail: first ? customerEmail : undefined
        };
        saveOrder(order);
        if (first && customerEmail) sendReceiptEmail(order);
        first = false;
      });
    } else {
      const order = {
        cart,
        total,
        method: 'card',
        status: 'pending',
        time: new Date().toISOString(),
        orderType,
        customerName,
        customerPhone,
        customerAddress,
        customerPostcode,
        orderTimeSlot,
        customerEmail
      };
      saveOrder(order);
      if (customerEmail) sendReceiptEmail(order);
    }

    // Create line items for Stripe
    const line_items = Object.values(
      cart.reduce((acc, item) => {
        const key = `${item.name}||${item.price}`;
        if (!acc[key]) {
          acc[key] = {
            price_data: {
              currency: 'gbp',
              product_data: { name: item.name },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: 1,
          };
        } else {
          acc[key].quantity++;
        }
        return acc;
      }, {})
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:5500/pizza%20website/success.html',
      cancel_url: 'http://localhost:5500/pizza%20website/checkout.html',
    });
    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for cash orders
app.post('/cash-order', (req, res) => {
  const { cart, total, orderType, customerName, customerPhone, customerAddress, customerPostcode, orderTimeSlot, customerEmail } = req.body;
  // Block slot(s) if 8 or more pizzas already ordered, or if this order needs to span slots
  if (orderTimeSlot) {
    let pizzasInOrder = 0;
    cart.forEach(item => {
      if (typeof item.name === 'string' && item.name.toLowerCase().includes('pizza')) pizzasInOrder++;
    });
    if (pizzasInOrder > 8) {
      // Need to span slots
      if (!canFitPizzaOrderInSlots(orderTimeSlot, pizzasInOrder)) {
        return res.status(400).json({ error: 'Not enough space in this and following slots for your pizza order. Please choose another time.' });
      }
    } else {
      const pizzasInSlot = getPizzaCountForSlot(orderTimeSlot);
      if (pizzasInSlot + pizzasInOrder > 8) {
        return res.status(400).json({ error: 'This time slot is full. Please choose another.' });
      }
    }
  }
  // If more than 8 pizzas, split the order into multiple slots for blocking
  let pizzasInOrder = 0;
  cart.forEach(item => {
    if (typeof item.name === 'string' && item.name.toLowerCase().includes('pizza')) pizzasInOrder++;
  });
  if (orderTimeSlot && pizzasInOrder > 8) {
    const blocks = blockPizzaOrderInSlots(orderTimeSlot, pizzasInOrder);
    if (!blocks) {
      return res.status(400).json({ error: 'Not enough space in this and following slots for your pizza order. Please choose another time.' });
    }
    let first = true;
    blocks.forEach(b => {
      const order = {
        cart,
        total,
        method: 'cash',
        status: 'unpaid',
        time: new Date().toISOString(),
        orderType,
        customerName,
        customerPhone,
        customerAddress,
        customerPostcode,
        orderTimeSlot: b.slot,
        pizzasBlocked: b.count,
        isMainOrder: first,
        customerEmail: first ? customerEmail : undefined
      };
      saveOrder(order);
      if (first && customerEmail) sendReceiptEmail(order);
      first = false;
    });
    res.json({ success: true });
    return;
  } else {
    const order = {
      cart,
      total,
      method: 'cash',
      status: 'unpaid',
      time: new Date().toISOString(),
      orderType,
      customerName,
      customerPhone,
      customerAddress,
      customerPostcode,
      orderTimeSlot,
      customerEmail
    };
    saveOrder(order);
    if (customerEmail) sendReceiptEmail(order);
    res.json({ success: true });
  }
});

// Dashboard to view orders
app.get('/orders', (req, res) => {
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  }
  let html = `
  <html>
  <head>
    <title>Orders Dashboard</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 0; }
      h1 { background: #222; color: #fff; margin: 0; padding: 1rem; text-align: center; }
      .orders-container { max-width: 700px; margin: 2rem auto; }
      .ticket { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; margin-bottom: 2rem; padding: 1.5rem 2rem; position: relative; page-break-after: always; }
      .ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
      .ticket-method { font-weight: bold; color: #635bff; }
      .ticket-status { font-size: 0.95em; color: #888; }
      .ticket-time { font-size: 0.95em; color: #888; }
      .ticket-items { margin: 1rem 0; }
      .ticket-items li { font-size: 1.1em; margin-bottom: 0.3em; }
      .ticket-total { font-size: 1.2em; font-weight: bold; margin-top: 1rem; }
      .print-btn { background: #2ecc40; color: #fff; border: none; border-radius: 4px; padding: 0.5em 1.2em; font-size: 1em; cursor: pointer; margin-top: 1em; }
      @media print {
        body { background: #fff; }
        .print-btn, h1, .orders-container { display: none !important; }
        .ticket { box-shadow: none; border: 1px dashed #888; margin: 0 0 2rem 0; }
      }
    </style>
  </head>
  <body>
    <h1>Orders Dashboard</h1>
    <div class="orders-container">
  `;
  if (orders.length === 0) {
    html += '<p>No orders yet.</p>';
  } else {
    // Group orders by main order (isMainOrder or unique time+customerName+phone)
    const shown = new Set();
    orders.forEach((order, i) => {
      // Only show main order or single-slot orders
      if (order.isMainOrder || typeof order.isMainOrder === 'undefined') {
        // Find all related orders (same time, name, phone, total)
        const related = orders.filter(o =>
          o.customerName === order.customerName &&
          o.customerPhone === order.customerPhone &&
          o.total === order.total &&
          o.time.slice(0,19) === order.time.slice(0,19)
        );
        // Get the latest slot
        let lastSlot = order.orderTimeSlot;
        if (related.length > 1) {
          // Sort slots by slot order
          const slots = [
            '17:00-17:30','17:30-18:00','18:00-18:30','18:30-19:00','19:00-19:30','19:30-20:00','20:00-20:30','20:30-21:00','21:00-21:30','21:30-22:00'
          ];
          const slotIndexes = related.map(r => slots.indexOf(r.orderTimeSlot)).filter(idx => idx !== -1);
          if (slotIndexes.length) {
            const maxIdx = Math.max(...slotIndexes);
            lastSlot = slots[maxIdx];
          }
        }
        // Only show once per group
        const groupKey = `${order.customerName}|${order.customerPhone}|${order.total}|${order.time.slice(0,19)}`;
        if (shown.has(groupKey)) return;
        shown.add(groupKey);
        html += `<div class="ticket">
          <div class="ticket-header">
            <span class="ticket-method">${order.method ? order.method.toUpperCase() : ''}</span>
            <span class="ticket-status">${order.status || ''}</span>
            <span class="ticket-time">${order.time ? new Date(order.time).toLocaleString() : ''}</span>
          </div>
            <div class="ticket-details" style="margin-bottom:0.7em; font-size:1.15em; font-weight:bold;">
              <div><span style="font-size:1.1em;">Type:</span> <span style="font-size:1.1em;">${order.orderType ? order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1) : 'N/A'}</span></div>
              <div><span style="font-size:1.1em;">Name:</span> <span style="font-size:1.1em;">${order.customerName || 'N/A'}</span></div>
              <div><span style="font-size:1.1em;">Phone:</span> <span style="font-size:1.1em;">${order.customerPhone || 'N/A'}</span></div>
                <div><span style="font-size:1.1em;">Time Slot:</span> <span style="font-size:1.1em;">${lastSlot || 'N/A'}</span></div>
                ${order.orderComments ? `<div><span style="font-size:1.1em;">Comments:</span> <span style="font-size:1.1em;">${order.orderComments}</span></div>` : ''}
              ${(order.orderType === 'delivery') ? `<div><span style="font-size:1.1em;">Address:</span> <span style="font-size:1.1em;">${order.customerAddress || 'N/A'}</span></div>
              <div><span style="font-size:1.1em;">Postcode:</span> <span style="font-size:1.1em;">${order.customerPostcode || 'N/A'}</span></div>` : ''}
            </div>
          <ul class="ticket-items">
            ${order.cart.map(item => `<li>${item.name} <span style='float:right'>£${item.price.toFixed(2)}</span></li>`).join('')}
          </ul>
          <div class="ticket-total">Total: £${order.total.toFixed(2)}</div>
          <button class="print-btn" onclick="(function(e){e.stopPropagation();var el=this.parentNode;el.classList.add('printme');window.print();el.classList.remove('printme');})(event)">Print Ticket</button>
        </div>`;
      }
    });
  }
  html += `</div></body></html>`;
  res.send(html);
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Stripe server running on http://localhost:${PORT}`));
