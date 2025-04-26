const mongoose = require('mongoose');

// Cache connection promise
let dbConnection = null;

// Connect to MongoDB
exports.dbConnect = async () => {
  // If we already have a connection, use it
  if (dbConnection) {
    return dbConnection;
  }

  // Get MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Configure mongoose connection
  mongoose.set('strictQuery', false);

  // Connect to MongoDB
  try {
    dbConnection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    return dbConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Explicitly close connection (useful for testing)
exports.dbDisconnect = async () => {
  if (!mongoose.connection) return;
  
  try {
    await mongoose.connection.close();
    dbConnection = null;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}; 