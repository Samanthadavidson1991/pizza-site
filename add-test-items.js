const { MongoClient } = require('mongodb');

// MongoDB connection (from server.js)
const uri = 'mongodb+srv://thecrustngb:Leedsutd01@cluster0.qec8gul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

// Test menu with variety options in each section
const testMenu = [
  // PIZZAS - with size varieties
  {
    "name": "🧪 Test Margherita Pizza",
    "category": "PIZZAS",
    "description": "TEST ITEM: Classic tomato and mozzarella - Click size options!",
    "sizes": [
      {"size": "Small (10\")", "price": 9.99},
      {"size": "Medium (12\")", "price": 12.99},
      {"size": "Large (14\")", "price": 15.99}
    ]
  },
  
  // DRINKS - with size varieties
  {
    "name": "🧪 Test Cola",
    "category": "DRINKS",
    "description": "TEST ITEM: Refreshing cola - Click size options!",
    "types": [
      {"name": "Small Cup", "price": 1.50},
      {"name": "Medium Cup", "price": 2.50},
      {"name": "Large Cup", "price": 3.50}
    ]
  },
  
  // SIDES - regular clickable item
  {
    "name": "🧪 Test Garlic Bread",
    "category": "SIDES",
    "description": "TEST ITEM: Single item - Should be clickable!",
    "price": 4.99
  },
  
  // SIDES - auto-add varieties
  {
    "name": "🧪 Test Sauces",
    "category": "SIDES",
    "description": "TEST ITEM: Auto-add sauces - Click once to add!",
    "autoAdd": true,
    "types": [
      {"name": "Test Ketchup", "price": 0.50},
      {"name": "Test Mayo", "price": 0.75},
      {"name": "Test BBQ", "price": 0.75}
    ]
  },
  
  // DESSERTS - new category with varieties
  {
    "name": "🧪 Test Ice Cream",
    "category": "DESSERTS",
    "description": "TEST ITEM: Sweet treat - Click flavor options!",
    "types": [
      {"name": "Vanilla Scoop", "price": 2.99},
      {"name": "Chocolate Scoop", "price": 2.99},
      {"name": "Strawberry Scoop", "price": 2.99}
    ]
  },
  
  // CHICKEN - new category with size varieties
  {
    "name": "🧪 Test Chicken Wings",
    "category": "CHICKEN",
    "description": "TEST ITEM: Crispy wings - Click portion sizes!",
    "sizes": [
      {"size": "6 Wings", "price": 6.99},
      {"size": "12 Wings", "price": 11.99},
      {"size": "18 Wings", "price": 16.99}
    ]
  }
];

async function addTestItems() {
  try {
    console.log('🧪 Adding test items to check clickable functionality...');
    await client.connect();
    
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    // Remove any existing test items first
    console.log('🗑️ Removing old test items...');
    await menuCollection.deleteMany({ name: { $regex: "🧪 Test" } });
    
    // Add new test items
    console.log('➕ Adding new test items...');
    const result = await menuCollection.insertMany(testMenu);
    
    console.log(`✅ Added ${result.insertedCount} test items!`);
    console.log('\n🧪 TEST ITEMS ADDED:');
    testMenu.forEach(item => {
      console.log(`- ${item.name} (${item.category})`);
      if (item.sizes) console.log(`  └─ Has ${item.sizes.length} size options - SHOULD BE CLICKABLE`);
      if (item.types) console.log(`  └─ Has ${item.types.length} type options - SHOULD BE CLICKABLE`);
      if (item.autoAdd) console.log(`  └─ AUTO-ADD enabled - CLICK ONCE TO ADD`);
      if (item.price && !item.sizes && !item.types) console.log(`  └─ Single price - SHOULD BE CLICKABLE`);
    });
    
    console.log('\n🎯 Go to thecrustatngb.co.uk/menu.html and test each item!');
    
  } catch (error) {
    console.error('❌ Error adding test items:', error);
  } finally {
    await client.close();
  }
}

addTestItems();