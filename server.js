const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Serve static files last
app.use(express.static(__dirname));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('SERVER.JS STARTED - Updated Version');
  console.log(`🚀 Clean server running on port ${PORT}`);
  console.log('📝 Endpoints: /test, /menu (GET/POST/DELETE), /login');
  console.log('🔥 POST /menu endpoint should work now!');
});