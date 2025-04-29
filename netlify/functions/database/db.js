const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    console.log('Connecting to MongoDB...');
    // Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    cachedConnection = conn;
    console.log('MongoDB Connected Successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
}

module.exports = connectDB;