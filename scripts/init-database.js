// Initialize MongoDB database and collections
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'weight_tracker';

async function initializeDatabase() {
  if (!uri) {
    console.error('❌ Error: MONGODB_URI environment variable is not defined');
    console.log('Please create a .env file with your MongoDB connection string.');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB Atlas...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(dbName);
    
    // Create collections if they don't exist
    console.log('🔄 Creating collections...');
    
    // Weight entries collection
    try {
      await db.createCollection('weight_entries');
      console.log('✅ Created weight_entries collection');
    } catch (error) {
      if (error.code === 48) {  // Collection already exists
        console.log('ℹ️ weight_entries collection already exists');
      } else {
        throw error;
      }
    }
    
    // Users collection
    try {
      await db.createCollection('users');
      console.log('✅ Created users collection');
    } catch (error) {
      if (error.code === 48) {  // Collection already exists
        console.log('ℹ️ users collection already exists');
      } else {
        throw error;
      }
    }
    
    // Create indexes
    console.log('🔄 Creating indexes...');
    
    // Index for weight entries - allows fast lookup by userId + date
    await db.collection('weight_entries').createIndex({ userId: 1, date: 1 }, { unique: true });
    console.log('✅ Created index on weight_entries (userId, date)');
    
    // Index for users
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✅ Created index on users (email)');
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log(`\nYou can now connect your application to MongoDB Atlas.`);
    console.log(`Make sure your .env file contains:\nMONGODBURI=${uri}\nUSELOCALSTORAGEFALLBACK=false`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

initializeDatabase().catch(console.error); 