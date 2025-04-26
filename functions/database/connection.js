/**
 * MongoDB Connection Utility
 * Manages database connection with connection pooling
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Cache the database connection
let cachedConnection = null;

/**
 * Connect to MongoDB
 * Uses connection pooling for Netlify Functions
 * 
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connectToDatabase() {
  // If we have a cached connection, return it
  if (cachedConnection) {
    return cachedConnection;
  }

  // Get MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    // Set mongoose options
    const options = {
      // Use new URL parser to avoid deprecation warnings
      useNewUrlParser: true,
      // Use new server discovery and monitoring engine
      useUnifiedTopology: true,
    };

    // Connect to MongoDB
    await mongoose.connect(uri, options);
    
    // Cache the database connection
    cachedConnection = mongoose.connection;
    
    // Log connection status
    console.log('MongoDB connected successfully');
    
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
}; 