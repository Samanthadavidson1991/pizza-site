const { MongoClient } = require('mongodb');

// MongoDB connection (from server.js)
const uri = 'mongodb+srv://thecrustngb:Leedsutd01@cluster0.qec8gul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);

// Menu data with interactive varieties
const menuData = [
  {
    "name": "Margherita Pizza",
    "category": "PIZZAS",
    "description": "Classic tomato and mozzarella",
    "sizes": [
      {"size": "Small (10\")", "price": 9.99},
      {"size": "Medium (12\")", "price": 12.99},
      {"size": "Large (14\")", "price": 15.99}
    ]
  },
  {
    "name": "Pepperoni Pizza", 
    "category": "PIZZAS",
    "description": "Pepperoni and mozzarella",
    "sizes": [
      {"size": "Small (10\")", "price": 11.99},
      {"size": "Medium (12\")", "price": 14.99},
      {"size": "Large (14\")", "price": 17.99}
    ]
  },
  {
    "name": "BBQ Chicken Pizza",
    "category": "PIZZAS", 
    "description": "BBQ sauce, chicken, and mozzarella",
    "sizes": [
      {"size": "Small (10\")", "price": 13.99},
      {"size": "Medium (12\")", "price": 16.99},
      {"size": "Large (14\")", "price": 19.99}
    ]
  },
  {
    "name": "Garlic Bread",
    "price": 4.99,
    "category": "SIDES",
    "description": "Fresh garlic bread"
  },
  {
    "name": "Dips",
    "category": "SIDES",
    "description": "Choose your favorite dip",
    "autoAdd": true,
    "types": [
      {"name": "Ketchup", "price": 0.50},
      {"name": "Garlic Mayo", "price": 0.75},
      {"name": "BBQ Sauce", "price": 0.75},
      {"name": "Sweet Chili", "price": 0.75},
      {"name": "Ranch Dressing", "price": 0.75}
    ]
  },
  {
    "name": "Extra Toppings",
    "category": "SIDES", 
    "description": "Add extra toppings to any pizza",
    "autoAdd": true,
    "types": [
      {"name": "Extra Cheese", "price": 1.50},
      {"name": "Pepperoni", "price": 2.00},
      {"name": "Mushrooms", "price": 1.25},
      {"name": "Olives", "price": 1.25},
      {"name": "Peppers", "price": 1.25}
    ]
  },
  {
    "name": "Coca Cola",
    "category": "DRINKS",
    "description": "Refreshing soft drink",
    "types": [
      {"name": "330ml Can", "price": 1.50},
      {"name": "500ml Bottle", "price": 2.50},
      {"name": "1.5L Bottle", "price": 3.99}
    ]
  },
  {
    "name": "Orange Juice",
    "category": "DRINKS",
    "description": "Fresh orange juice",
    "types": [
      {"name": "Small Glass", "price": 2.99},
      {"name": "Large Glass", "price": 3.99}
    ]
  }
];

async function seedMenu() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('pizza_shop');
    const menuCollection = db.collection('menu');
    
    // Clear existing menu items
    console.log('🗑️ Clearing existing menu items...');
    await menuCollection.deleteMany({});
    
    // Insert new menu items
    console.log('📝 Inserting new menu items with interactive varieties...');
    const result = await menuCollection.insertMany(menuData);
    
    console.log(`✅ Successfully inserted ${result.insertedCount} menu items!`);
    console.log('🎉 Menu database updated with interactive varieties!');
    
  } catch (error) {
    console.error('❌ Error seeding menu:', error);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the seeding
seedMenu();