// Update menu item by id
app.put('/menu/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    const id = req.params.id;
    const updatedItem = req.body;
    // Remove _id if present to avoid MongoDB update errors
    if (updatedItem._id) delete updatedItem._id;
    // Try both string and ObjectId for compatibility
    const result = await menuCollection.updateOne(
      { $or: [ { id: Number(id) }, { _id: id }, { _id: { $eq: id } } ] },
      { $set: updatedItem }
    );
    if (result.matchedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Menu item not found.' });
    }
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(500).json({ error: 'Failed to update menu item.' });
  }
});
// Delete menu item by id
app.delete('/menu/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    const id = req.params.id;
    // Try both string and ObjectId for compatibility
    const result = await menuCollection.deleteOne({ $or: [ { id: Number(id) }, { _id: id }, { _id: { $eq: id } } ] });
    if (result.deletedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Menu item not found.' });
    }
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ error: 'Failed to delete menu item.' });
  }
});

// --- Module Imports and App Initialization ---
console.log('SERVER.JS STARTED');

const { MongoClient } = require('mongodb');

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies
// Get all orders for admin page
app.get('/orders', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('pizza_shop');
    const ordersCollection = db.collection('orders');
    const orders = await ordersCollection.find({}).toArray();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Simple /login route for admin authentication
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Change these credentials as needed
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'password123';
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// MongoDB connection setup (not used yet)
const mongoUri = 'mongodb+srv://thecrustngb:Leedsutd01@cluster0.qec8gul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(mongoUri);

app.get('/menu', async (req, res) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('pizza_shop');
    console.log('Accessing menu collection...');
    const menuCollection = db.collection('menu');
    console.log('Querying menu data...');
    const menu = await menuCollection.find({}).toArray();
    console.log('Menu data:', menu);
    res.json(menu);
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: 'Failed to fetch menu.', details: err.message });
  }
});



// Add new menu item from admin page
app.post('/menu', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    const newItem = req.body;
    await menuCollection.insertOne(newItem);
    res.json({ success: true, item: newItem });
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(500).json({ error: 'Failed to add menu item.' });
  }
});

// Handle cash orders from checkout page
app.post('/cash-order', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('pizza_shop');
    const ordersCollection = db.collection('orders');
    const order = req.body;
    await ordersCollection.insertOne(order);
    res.json({ success: true });
  } catch (err) {
    console.error('Error placing cash order:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
