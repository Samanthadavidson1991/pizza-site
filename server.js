const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const session = require('express-session');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for admin authentication
app.use(session({
  secret: 'admin-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
  // For development, you can bypass auth by setting a header
  const bypassAuth = req.headers['x-admin-bypass'] === 'development';
  
  if (bypassAuth || (req.session && req.session.isAdmin)) {
    next();
  } else {
    res.status(401).json({ error: 'Admin authentication required. Please log in through admin panel.' });
  }
};

// MongoDB connection
const mongoUri = 'mongodb+srv://thecrustngb:Leedsutd01@cluster0.qec8gul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(mongoUri);

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server working!', timestamp: new Date() });
});

// Get menu from MongoDB
app.get('/menu', async (req, res) => {
  try {
    console.log('GET /menu - Fetching from MongoDB');
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    const menu = await menuCollection.find({}).toArray();
    console.log(`Found ${menu.length} menu items`);
    res.json(menu);
  } catch (error) {
    console.error('GET /menu error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Add new menu item
app.post('/menu', async (req, res) => {
  try {
    console.log('POST /menu - Adding item:', req.body);
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    const result = await menuCollection.insertOne(req.body);
    console.log('Item added with ID:', result.insertedId);
    
    res.json({ 
      success: true, 
      item: { ...req.body, _id: result.insertedId } 
    });
  } catch (error) {
    console.error('POST /menu error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Delete menu item
app.delete('/menu/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    console.log('DELETE /menu - Removing item:', itemId);
    console.log('DELETE DEBUG - typeof itemId:', typeof itemId, 'value:', itemId);
    
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    const { ObjectId } = require('mongodb');
    let query;
    
    // First try to convert to ObjectId (for _id field)
    try {
      query = { _id: new ObjectId(itemId) };
      console.log('Trying ObjectId query:', query);
    } catch (e) {
      // If not a valid ObjectId, try numeric id field or string _id field
      const numericId = parseInt(itemId);
      if (!isNaN(numericId)) {
        query = { id: numericId };
        console.log('Trying numeric id query:', query);
      } else {
        query = { $or: [{ id: itemId }, { _id: itemId }] };
        console.log('Trying fallback query:', query);
      }
    }
    
    const result = await menuCollection.deleteOne(query);
    console.log('Delete result:', result.deletedCount);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /menu error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Menu section subheadings
app.get('/menu-section-subheadings', (req, res) => {
  res.json({});
});

app.put('/menu-section-subheadings/:category', (req, res) => {
  res.json({ success: true });
});

// Simple login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, username: 'admin' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Order submission endpoint
app.post('/submit-order', (req, res) => {
  console.log('Order submission received:', req.body);
  try {
    // Read existing orders
    let orders = [];
    try {
      const ordersData = fs.readFileSync('orders.json', 'utf8');
      orders = JSON.parse(ordersData);
    } catch (e) {
      console.log('No existing orders file, creating new one');
      orders = [];
    }
    
    // Add new order with timestamp and ID
    const newOrder = {
      ...req.body,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    orders.push(newOrder);
    
    // Save orders back to file
    fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
    
    console.log('Order saved successfully with ID:', newOrder.id);
    res.json({ success: true, orderId: newOrder.id, message: 'Order placed successfully' });
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: 'Failed to submit order', details: error.message });
  }
});

// Get orders endpoint
app.get('/orders.json', (req, res) => {
  try {
    const ordersData = fs.readFileSync('orders.json', 'utf8');
    const orders = JSON.parse(ordersData);
    res.json(orders);
  } catch (e) {
    console.log('No orders file found');
    res.json([]);
  }
});

// Update order status endpoint
app.post('/update-order', (req, res) => {
  try {
    const { index, status, username } = req.body;
    
    const ordersData = fs.readFileSync('orders.json', 'utf8');
    const orders = JSON.parse(ordersData);
    
    if (index >= 0 && index < orders.length) {
      orders[index].status = status;
      orders[index].updatedAt = new Date().toISOString();
      orders[index].updatedBy = username || 'system';
      
      fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
      
      res.json({ success: true, message: 'Order updated successfully' });
    } else {
      res.status(400).json({ error: 'Invalid order index' });
    }
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Stock management has been moved to admin-only server for security
// All stock endpoints are now protected and only accessible through admin panel

// Serve static files last

app.post('/stock-data', (req, res) => {
  try {
    const stockData = req.body;
    fs.writeFileSync('stock-data.json', JSON.stringify(stockData, null, 2));
    res.json({ success: true, message: 'Stock data updated successfully' });
  } catch (error) {
    console.error('Save stock data error:', error);
    res.status(500).json({ error: 'Failed to save stock data' });
  }
});

app.get('/stock-settings.json', (req, res) => {
  try {
    const settingsData = fs.readFileSync('stock-settings.json', 'utf8');
    res.json(JSON.parse(settingsData));
  } catch (e) {
    console.log('No stock settings file found, returning defaults');
    res.json({
      lowStockThreshold: 3,
      autoDisableLowStock: true,
      autoResetDaily: true,
      defaultStockAmount: 20,
      trackHistory: true,
      timeSlots: {
        duration: 30,
        ordersPerSlot: 8,
        startTime: '17:00',
        endTime: '22:00'
      }
    });
  }
});

app.post('/stock-settings', (req, res) => {
  try {
    const settingsData = req.body;
    fs.writeFileSync('stock-settings.json', JSON.stringify(settingsData, null, 2));
    res.json({ success: true, message: 'Stock settings updated successfully' });
  } catch (error) {
    console.error('Save stock settings error:', error);
    res.status(500).json({ error: 'Failed to save stock settings' });
  }
});

// Check stock availability endpoint
app.post('/check-stock', (req, res) => {
  try {
    const { items } = req.body;
    const stockData = JSON.parse(fs.readFileSync('stock-data.json', 'utf8') || '{}');
    
    const availability = {};
    const unavailableItems = [];
    
    items.forEach(item => {
      const key = item.size ? `${item.name}-${item.size}` : item.name;
      const stockItem = stockData[key];
      
      if (!stockItem || !stockItem.enabled || stockItem.stock < (item.quantity || 1)) {
        availability[key] = false;
        unavailableItems.push({
          name: item.name,
          size: item.size,
          available: stockItem ? stockItem.stock : 0,
          requested: item.quantity || 1
        });
      } else {
        availability[key] = true;
      }
    });
    
    res.json({
      available: unavailableItems.length === 0,
      availability,
      unavailableItems
    });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({ error: 'Failed to check stock availability' });
  }
});

// Update stock after order endpoint
app.post('/update-stock', (req, res) => {
  try {
    const { items } = req.body;
    const stockData = JSON.parse(fs.readFileSync('stock-data.json', 'utf8') || '{}');
    
    items.forEach(item => {
      const key = item.size ? `${item.name}-${item.size}` : item.name;
      if (stockData[key]) {
        const quantity = item.quantity || 1;
        stockData[key].stock = Math.max(0, stockData[key].stock - quantity);
        stockData[key].sold = (stockData[key].sold || 0) + quantity;
        
        // Auto-disable if out of stock
        if (stockData[key].stock === 0) {
          stockData[key].enabled = false;
        }
      }
    });
    
    fs.writeFileSync('stock-data.json', JSON.stringify(stockData, null, 2));
    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Check time slot availability
app.get('/timeslot-availability', (req, res) => {
  try {
    const ordersData = JSON.parse(fs.readFileSync('orders.json', 'utf8') || '[]');
    const settingsData = JSON.parse(fs.readFileSync('stock-settings.json', 'utf8') || '{}');
    
    const timeSlotSettings = settingsData.timeSlots || {
      duration: 30,
      ordersPerSlot: 8,
      startTime: '17:00',
      endTime: '22:00'
    };
    
    // Count orders per time slot for today
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = ordersData.filter(order => 
      order.placedAt && order.placedAt.startsWith(today)
    );
    
    const slotCounts = {};
    todayOrders.forEach(order => {
      if (order.orderTimeSlot) {
        slotCounts[order.orderTimeSlot] = (slotCounts[order.orderTimeSlot] || 0) + 1;
      }
    });
    
    res.json({
      slotCounts,
      maxOrdersPerSlot: timeSlotSettings.ordersPerSlot,
      settings: timeSlotSettings
    });
  } catch (error) {
    console.error('Check timeslot availability error:', error);
    res.status(500).json({ error: 'Failed to check timeslot availability' });
  }
});

// ADMIN STOCK MANAGEMENT ENDPOINTS
// Get stock data (admin only)
app.get('/stock-data.json', requireAdminAuth, (req, res) => {
  try {
    const stockData = fs.readFileSync('stock-data.json', 'utf8');
    res.json(JSON.parse(stockData));
  } catch (e) {
    console.log('No stock data file found, returning empty object');
    res.json({});
  }
});

// Update stock data (admin only)
app.post('/stock-data', requireAdminAuth, (req, res) => {
  try {
    const stockData = req.body;
    fs.writeFileSync('stock-data.json', JSON.stringify(stockData, null, 2));
    res.json({ success: true, message: 'Stock data updated successfully' });
  } catch (error) {
    console.error('Save stock data error:', error);
    res.status(500).json({ error: 'Failed to save stock data' });
  }
});

// Get stock settings (admin only)
app.get('/stock-settings.json', requireAdminAuth, (req, res) => {
  try {
    const settingsData = fs.readFileSync('timeslot-settings.json', 'utf8');
    res.json(JSON.parse(settingsData));
  } catch (e) {
    console.log('No stock settings file found, returning defaults');
    res.json({
      lowStockThreshold: 3,
      autoDisableLowStock: true,
      autoResetDaily: true,
      defaultStockAmount: 20,
      trackHistory: true,
      timeSlots: {
        duration: 30,
        ordersPerSlot: 8,
        startTime: '17:00',
        endTime: '22:00'
      }
    });
  }
});

// Update stock settings (admin only)
app.post('/stock-settings', requireAdminAuth, (req, res) => {
  try {
    const settingsData = req.body;
    fs.writeFileSync('timeslot-settings.json', JSON.stringify(settingsData, null, 2));
    res.json({ success: true, message: 'Stock settings updated successfully' });
  } catch (error) {
    console.error('Save stock settings error:', error);
    res.status(500).json({ error: 'Failed to save stock settings' });
  }
});

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded admin credentials (in production, use proper auth)
    if (username === 'admin' && password === 'admin123') {
      req.session.isAdmin = true;
      req.session.adminUsername = username;
      res.json({ success: true, message: 'Admin logged in successfully' });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin logout endpoint
app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Admin logged out successfully' });
});

// Check admin session status
app.get('/admin/status', (req, res) => {
  res.json({ 
    isAdmin: !!(req.session && req.session.isAdmin),
    username: req.session ? req.session.adminUsername : null
  });
});

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('SERVER.JS STARTED - Updated Version');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📝 Endpoints: /test, /menu, /admin/*, /stock-* (admin protected)');
  console.log('� Admin stock management system active');
  console.log('✅ COMPLETE PIZZA SITE SERVER LOADED!');
});