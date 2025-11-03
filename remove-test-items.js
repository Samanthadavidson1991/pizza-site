const { MongoClient } = require('mongodb');

// MongoDB connection
const uri = 'mongodb+srv://thecrustngb:Leedsutd01@cluster0.qec8gul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

async function removeTestItems() {
  try {
    console.log('🗑️ Removing test items...');
    await client.connect();
    
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    // Remove test items
    const result = await menuCollection.deleteMany({ name: { $regex: "🧪 Test" } });
    
    console.log(`✅ Removed ${result.deletedCount} test items!`);
    console.log('🧹 Menu is now clean of test items');
    
  } catch (error) {
    console.error('❌ Error removing test items:', error);
  } finally {
    await client.close();
  }
}

removeTestItems();