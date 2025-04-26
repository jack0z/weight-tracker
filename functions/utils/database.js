/**
 * Database Connection Utility
 * Handles MongoDB connection with connection pooling using Mongoose
 */

const mongoose = require('mongoose');
let cachedDb = null;

/**
 * Connect to MongoDB
 * This function implements connection pooling to reuse connections
 * in the serverless environment
 * 
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  // Get MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI not set in environment variables');
  }
  
  // Connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  
  try {
    // Connect to the database
    const db = await mongoose.connect(uri, options);
    
    // Cache the database connection
    cachedDb = db;
    
    console.log('MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = { connectToDatabase }; 