// Script to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not defined');
    console.log('Please set the MONGODB_URI variable in your .env file');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log(`🔄 Attempting to connect to MongoDB...`);
    console.log(`   URI: ${maskConnectionString(process.env.MONGODB_URI)}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    
    console.log(`✅ Successfully connected to MongoDB at ${mongoose.connection.host}`);
    
    // Get server information
    const admin = mongoose.connection.db.admin();
    const serverInfo = await admin.serverInfo();
    
    console.log('\n📊 Server Information:');
    console.log(`   MongoDB Version: ${serverInfo.version}`);
    console.log(`   Server: ${serverInfo.host}`);
    
    // List databases
    const dbInfo = await admin.listDatabases();
    
    console.log('\n📋 Available Databases:');
    dbInfo.databases.forEach(db => {
      console.log(`   - ${db.name} (${formatSize(db.sizeOnDisk)})`);
    });
    
    // Get current database collections
    const collections = await mongoose.connection.db.collections();
    
    console.log(`\n📋 Collections in current database (${mongoose.connection.db.databaseName}):`);
    
    if (collections.length === 0) {
      console.log('   No collections found');
    } else {
      for (const collection of collections) {
        const count = await collection.countDocuments();
        console.log(`   - ${collection.collectionName} (${count} documents)`);
      }
    }
    
    console.log('\n✅ MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection test failed:');
    console.error(`   ${error.message}`);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n🔍 Troubleshooting tips:');
      console.log('   - Check if your MongoDB server is running');
      console.log('   - Verify that your connection string is correct');
      console.log('   - Make sure your IP address is whitelisted in MongoDB Atlas');
      console.log('   - Check your network connection and firewall settings');
    }
    
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Helper function to mask connection string for printing
function maskConnectionString(uri) {
  try {
    // Only show protocol and host, mask the credentials and params
    const url = new URL(uri);
    return `${url.protocol}//${url.hostname}`;
  } catch (e) {
    return '[Invalid URI format]';
  }
}

// Helper function to format size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Run the test
testConnection().catch(console.error); 