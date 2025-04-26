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

// Cache connection
let cachedConnection = null;

/**
 * Connect to the database
 * @returns {Promise<mongoose.Connection>}
 */
const connectToDatabase = async () => {
  // If we already have a connection, use it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // Get the MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Cache the connection
    cachedConnection = conn;
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

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