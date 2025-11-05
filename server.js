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
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  connectTimeoutMS: 10000, // Give up initial connection after 10s
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server working!', timestamp: new Date() });
});

// Helper functions for dough management
function isDoughBasedItem(itemName) {
  const doughItems = ['pizza', 'garlic bread', 'dough balls', 'doughballs', 'pizza bread'];
  return doughItems.some(doughItem => itemName?.toLowerCase().includes(doughItem));
}

function updateDoughStock(doughPortionsUsed) {
  try {
    // Load current dough stock
    let doughStock = {
      available: 50,
      used: 0,
      lowThreshold: 10
    };
    
    try {
      const saved = fs.readFileSync('dough-stock.json', 'utf8');
      doughStock = { ...doughStock, ...JSON.parse(saved) };
    } catch (e) {
      console.log('No existing dough stock file, using defaults');
    }

    // Update used count
    doughStock.used += doughPortionsUsed;
    
    // Save updated dough stock
    fs.writeFileSync('dough-stock.json', JSON.stringify(doughStock, null, 2));
    
    // Check if we need to disable dough items
    const remaining = doughStock.available - doughStock.used;
    if (remaining <= 0) {
      console.log('⚠️ DOUGH DEPLETED - All dough items should be disabled');
      // In a full system, this would trigger disabling all dough items in your menu
    } else if (remaining <= doughStock.lowThreshold) {
      console.log(`⚠️ LOW DOUGH WARNING - Only ${remaining} portions remaining`);
    }
    
    return doughStock;
  } catch (error) {
    console.error('Failed to update dough stock:', error);
    throw error;
  }
}

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
    // Fallback to local menu.json if MongoDB fails
    try {
      const localMenu = JSON.parse(fs.readFileSync('menu.json', 'utf8'));
      console.log('Falling back to local menu.json');
      res.json(localMenu);
    } catch (localError) {
      res.status(500).json({ error: 'Failed to fetch menu from database and local file' });
    }
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
    console.log('DELETE TIMESTAMP:', new Date().toISOString());
    
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
    
    // Test: First find the item to see if it exists
    const testFind = await menuCollection.findOne(query);
    console.log('FOUND ITEM BEFORE DELETE:', testFind);
    
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

// Order submission endpoint (for admin panel to receive orders)
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

    // Update dough stock when order contains dough-based items
    try {
      let doughUsed = 0;
      if (newOrder.items && Array.isArray(newOrder.items)) {
        newOrder.items.forEach(item => {
          if (isDoughBasedItem(item.name)) {
            doughUsed += item.quantity || 1;
          }
        });
      }

      if (doughUsed > 0) {
        updateDoughStock(doughUsed);
        console.log(`Order ${newOrder.id}: Used ${doughUsed} dough portions`);
      }
    } catch (doughError) {
      console.error('Dough stock update error:', doughError);
      // Don't fail the order if dough update fails
    }    console.log('Order saved successfully with ID:', newOrder.id);
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

// PROTECTED ADMIN-ONLY STOCK MANAGEMENT ENDPOINTS
// All stock management endpoints require admin authentication

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

// Get dough stock status
app.get('/dough-stock.json', (req, res) => {
  try {
    let doughStock = {
      available: 50,
      used: 0,
      lowThreshold: 10
    };
    
    try {
      const saved = fs.readFileSync('dough-stock.json', 'utf8');
      doughStock = { ...doughStock, ...JSON.parse(saved) };
    } catch (e) {
      // Return defaults if no file exists
    }
    
    res.json({
      ...doughStock,
      remaining: Math.max(0, doughStock.available - doughStock.used)
    });
  } catch (error) {
    console.error('Get dough stock error:', error);
    res.status(500).json({ error: 'Failed to get dough stock' });
  }
});

// Save dough stock (admin only)
app.post('/dough-stock.json', requireAdminAuth, (req, res) => {
  try {
    const doughStock = req.body;
    fs.writeFileSync('dough-stock.json', JSON.stringify(doughStock, null, 2));
    res.json({ success: true, message: 'Dough stock saved successfully' });
  } catch (error) {
    console.error('Save dough stock error:', error);
    res.status(500).json({ error: 'Failed to save dough stock' });
  }
});

// Get stock settings (admin only)
app.get('/stock-settings.json', requireAdminAuth, (req, res) => {
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

// Update stock settings (admin only)
app.post('/stock-settings', requireAdminAuth, (req, res) => {
  try {
    const settingsData = req.body;
    fs.writeFileSync('stock-settings.json', JSON.stringify(settingsData, null, 2));
    res.json({ success: true, message: 'Stock settings updated successfully' });
  } catch (error) {
    console.error('Save stock settings error:', error);
    res.status(500).json({ error: 'Failed to save stock settings' });
  }
});

// Get timeslot settings (admin only)
app.get('/timeslot-settings.json', requireAdminAuth, (req, res) => {
  try {
    const settingsData = fs.readFileSync('timeslot-settings.json', 'utf8');
    res.json(JSON.parse(settingsData));
  } catch (e) {
    console.log('No timeslot settings file found, returning defaults');
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

// Update timeslot settings (admin only)
app.post('/timeslot-settings', requireAdminAuth, (req, res) => {
  try {
    const settingsData = req.body;
    fs.writeFileSync('timeslot-settings.json', JSON.stringify(settingsData, null, 2));
    res.json({ success: true, message: 'Timeslot settings updated successfully' });
  } catch (error) {
    console.error('Save timeslot settings error:', error);
    res.status(500).json({ error: 'Failed to save timeslot settings' });
  }
});

// Check stock availability - This can be used by checkout but requires minimal auth
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

// Update stock after order - Used by checkout system
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
    
    // Calculate available time slots for today
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = ordersData.filter(order => 
      order.deliveryDate === today
    );
    
    const slotCounts = {};
    todayOrders.forEach(order => {
      if (order.deliveryTime) {
        slotCounts[order.deliveryTime] = (slotCounts[order.deliveryTime] || 0) + 1;
      }
    });
    
    const availableSlots = {};
    Object.keys(slotCounts).forEach(slot => {
      availableSlots[slot] = Math.max(0, timeSlotSettings.ordersPerSlot - slotCounts[slot]);
    });
    
    res.json({
      settings: timeSlotSettings,
      availability: availableSlots,
      totalOrdersToday: todayOrders.length
    });
  } catch (error) {
    console.error('Timeslot availability error:', error);
    res.status(500).json({ error: 'Failed to get timeslot availability' });
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

// Redirect checkout.html to checkout-enhanced.html to fix caching issues
app.get('/checkout.html', (req, res) => {
  res.redirect(301, '/checkout-enhanced.html');
});

// Redirect bare /checkout to enhanced version
app.get('/checkout', (req, res) => {
  res.redirect(301, '/checkout-enhanced.html');
});

// Handle root route - serve admin dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Set cache control headers for static files
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // Don't cache HTML files to prevent old checkout from being cached
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('SERVER.JS STARTED - Updated Version');
  console.log(`🚀 Admin server running on port ${PORT}`);
  console.log('📝 Endpoints: /test, /menu, /admin/*, /stock-* (admin protected)');
  console.log('� Admin-only stock management endpoints active');
  console.log('✅ SECURE ADMIN SERVER LOADED!');
});