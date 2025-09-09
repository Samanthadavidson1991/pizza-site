// --- Module Imports and App Initialization ---
console.log('SERVER.JS STARTED');

const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();

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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
