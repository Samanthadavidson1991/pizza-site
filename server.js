// Refund endpoint for Stripe card orders
app.post('/refund-order', async (req, res) => {
  const { orderId, username } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId.' });
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
  }
  const order = orders.find(o => o.id === orderId || o._id === orderId);
  if (!order || order.method !== 'card') {
    return res.status(404).json({ error: 'Order not found or not a card payment.' });
  }
  if (!order.stripePaymentIntentId) {
    return res.status(400).json({ error: 'No Stripe payment intent found for this order.' });
  }
  try {
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: Math.round((order.total || 0) * 100)
    });
    // Mark order as refunded
    order.status = 'refunded';
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { generateMenuHTML } = require('./generate-menu-html');





const app = express();

// CORS middleware MUST be before express.json() and all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// MongoDB connection setup
const mongoUri = 'mongodb+srv://thecrustngb:1FulWR9u2F7ii0Ef@cluster0.qec8gul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(mongoUri);
let menuCollection;

async function connectMongo() {
  try {
    await client.connect();
    const db = client.db('pizza_shop');
    menuCollection = db.collection('menu');
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
connectMongo();
app.use(express.static(__dirname));
app.disable('x-powered-by');

app.use(express.json()); // <-- This must come after CORS

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

const USERS_FILE = path.join(__dirname, 'users.json');
const MENU_HTML_FILE = path.join(__dirname, 'menu pizza website take 1.html');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// --- USER LOGIN ENDPOINT ---
// Handle accidental GET requests to /login with a JSON error
app.get('/login', (req, res) => {
  res.status(405).json({ error: 'Use POST for /login.' });
});

app.post('/login', async (req, res) => {
  try {
    console.log('LOGIN ENDPOINT HIT');
    console.log('req.headers:', req.headers);
    console.log('req.body:', req.body);
    if (!req.body) {
      console.log('RETURN: No body received');
      return res.status(400).json({ error: 'No body received.' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      console.log('RETURN: Username and password required');
      return res.status(400).json({ error: 'Username and password required.' });
    }
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE));
    }
    const user = users.find(u => u.username === username);
    if (!user) {
      console.log('RETURN: Invalid credentials (user not found)');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      console.log('RETURN: Invalid credentials (password mismatch)');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    console.log('RETURN: Success');
    res.json({ success: true, username });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});
// --- MENU MANAGEMENT ENDPOINTS ---

// --- MENU ENDPOINTS (MongoDB) ---
// GET menu
app.get('/menu', async (req, res) => {
  try {
    const menu = await menuCollection.find({}).toArray();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu.' });
  }
});
  // GET single menu item by id
  app.get('/menu/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await menuCollection.findOne({ id });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch menu item.' });
    }
  });

// POST new menu item
app.post('/menu', async (req, res) => {
  try {
    const item = req.body;
    // Generate a numeric id for compatibility with old code
    const last = await menuCollection.find().sort({ id: -1 }).limit(1).toArray();
    item.id = last.length ? last[0].id + 1 : 1;
    await menuCollection.insertOne(item);
    res.json({ success: true, id: item.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add menu item.' });
  }
});

// PUT update menu item
app.put('/menu/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = req.body;
    const result = await menuCollection.updateOne({ id }, { $set: updated });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item.' });
  }
});

// DELETE menu item
app.delete('/menu/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await menuCollection.deleteOne({ id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item.' });
  }
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

// Allow all origins for local development (fixes CORS for file:// and localhost)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

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

// Dashboard to view orders (returns JSON array for frontend)
app.get('/orders', (req, res) => {
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    try {
      orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    } catch (e) {
      console.error('ORDERS JSON PARSE ERROR:', e);
      orders = [];
    }
  }
  res.json(Array.isArray(orders) ? orders : []);
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Stripe server running on http://localhost:${PORT}`));

// Place this after app is initialized and ORDERS_FILE is defined

// /orders.json endpoint for frontend compatibility
app.get('/orders.json', (req, res) => {
  let orders = [];
  if (fs.existsSync(ORDERS_FILE)) {
    try {
      orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    } catch (e) {
      console.error('ORDERS.JSON PARSE ERROR:', e);
      orders = [];
    }
  }
  res.json(Array.isArray(orders) ? orders : []);
});
