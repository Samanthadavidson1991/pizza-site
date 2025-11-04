const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    console.error('MongoDB error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// Add new menu item to MongoDB
app.post('/menu', async (req, res) => {
  try {
    console.log('POST /menu - Adding item to MongoDB');
    console.log('Request body:', req.body);
    
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    const result = await menuCollection.insertOne(req.body);
    console.log('Insert result:', result);
    
    res.json({ 
      success: true, 
      insertedId: result.insertedId,
      message: 'Menu item added successfully'
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Delete menu item from MongoDB
app.delete('/menu/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    console.log('DELETE /menu - Removing item with ID:', itemId);
    
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    const { ObjectId } = require('mongodb');
    const result = await menuCollection.deleteOne({ _id: new ObjectId(itemId) });
    
    if (result.deletedCount === 1) {
      res.json({ success: true, message: 'Menu item deleted successfully' });
    } else {
      res.status(404).json({ error: 'Menu item not found' });
    }
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Add order to orders.json
app.post('/order', (req, res) => {
  try {
    const order = req.body;
    order.timestamp = new Date().toISOString();
    order.id = Date.now().toString();
    
    let orders = [];
    try {
      const ordersData = fs.readFileSync('orders.json', 'utf8');
      orders = JSON.parse(ordersData);
    } catch (e) {
      console.log('No existing orders file, creating new one');
    }
    
    orders.push(order);
    fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
    
    res.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Add order error:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// Get orders from orders.json
app.get('/orders', (req, res) => {
  try {
    const ordersData = fs.readFileSync('orders.json', 'utf8');
    const orders = JSON.parse(ordersData);
    res.json(orders);
  } catch (e) {
    res.json([]);
  }
});

// Update order status
app.put('/orders/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;
    
    const ordersData = fs.readFileSync('orders.json', 'utf8');
    let orders = JSON.parse(ordersData);
    
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex] = { ...orders[orderIndex], ...updateData };
      fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
      res.json({ success: true, order: orders[orderIndex] });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Delete order
app.delete('/orders/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    
    const ordersData = fs.readFileSync('orders.json', 'utf8');
    let orders = JSON.parse(ordersData);
    
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
      orders.splice(orderIndex, 1);
      fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Update order by index
app.put('/orders/index/:index', (req, res) => {
  try {
    const orderIndex = parseInt(req.params.index);
    const updateData = req.body;
    
    if (isNaN(orderIndex)) {
      return res.status(400).json({ error: 'Invalid order index' });
    }
    
    const ordersData = fs.readFileSync('orders.json', 'utf8');
    let orders = JSON.parse(ordersData);
    
    if (orderIndex >= 0 && orderIndex < orders.length) {
      orders[orderIndex] = { ...orders[orderIndex], ...updateData };
      fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
      res.json({ success: true, order: orders[orderIndex] });
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
app.use(express.static(__dirname));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('SERVER.JS STARTED - Customer Website Server');
  console.log(`🚀 Customer server running on port ${PORT}`);
  console.log('📝 Endpoints: /test, /menu (GET/POST/DELETE), /order, /orders');
  console.log('🔒 Stock management moved to secure admin server');
  console.log('✅ CLEAN CUSTOMER SERVER LOADED!');
});