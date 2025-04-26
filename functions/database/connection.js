const mongoose = require('mongoose');
require('dotenv').config();

// Schema definitions
const schemas = {
  WeightEntry: new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    weight: { type: Number, required: true },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })
};

// Add compound index for userId and date
schemas.WeightEntry.index({ userId: 1, date: 1 }, { unique: true });

// Cache the database connection
let cachedConnection = null;

/**
 * Connect to MongoDB Atlas or local MongoDB
 * Uses connection pooling to optimize serverless function performance
 */
async function connectToDatabase() {
  // If a connection already exists, return it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // Check if MongoDB URI is defined
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // Configure Mongoose
  mongoose.set('strictQuery', false);
  
  try {
    // Connect to MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pooling options for serverless functions
      maxPoolSize: 10, // Keep up to 10 connections open
      minPoolSize: 1,  // Keep at least 1 connection open
      socketTimeoutMS: 30000, // Close sockets after 30 seconds of inactivity
      connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
    });
    
    // Store the connection in cache
    cachedConnection = connection;
    
    // Log success
    console.log('Successfully connected to MongoDB');
    
    // Return the database connection
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get a mongoose model
 * @param {string} modelName - Name of the model
 * @returns {mongoose.Model}
 */
const getModel = (modelName) => {
  // Check if the schema exists
  if (!schemas[modelName]) {
    throw new Error(`Schema for model ${modelName} not found`);
  }
  
  // Check if the model is already registered
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  
  // Create and return the model
  return mongoose.model(modelName, schemas[modelName]);
};

module.exports = {
  connectToDatabase,
  getModel
}; 