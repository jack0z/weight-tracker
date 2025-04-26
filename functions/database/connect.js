/**
 * MongoDB Connection Utility
 * Handles connection pooling for serverless functions
 */

const mongoose = require('mongoose');

// Track connection status
let isConnected = false;

/**
 * Connects to MongoDB using connection pooling
 * Will reuse existing connection if available
 */
const connectToDatabase = async () => {
  // Return existing connection if already established
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // For serverless environments, maintain connection pool
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    
    isConnected = db.connections[0].readyState === 1; // 1 = connected
    
    if (isConnected) {
      console.log('Successfully connected to MongoDB');
    }
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Disconnects from MongoDB
 * Typically not needed in serverless functions as connections are reused
 */
const disconnectFromDatabase = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  isConnected: () => isConnected
}; 