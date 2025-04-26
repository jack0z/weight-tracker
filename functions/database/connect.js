/**
 * Database connection module for MongoDB with Mongoose
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connection state tracking
let isConnected = false;

/**
 * Connect to MongoDB
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function dbConnect() {
  // If we're already connected, reuse the existing connection
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }

  // Get the MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    // Connect with retries
    const connection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: 10 // Maintain up to 10 socket connections
    });

    isConnected = true;
    console.log('Database connection established');
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = dbConnect; 