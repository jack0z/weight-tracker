const mongoose = require('mongoose');

let cachedConnection = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function dbConnect() {
  // If we already have a connection, use it
  if (cachedConnection) {
    return cachedConnection;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    const conn = await mongoose.connect(MONGODB_URI, opts);
    cachedConnection = conn;
    
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = dbConnect; 