const mongoose = require('mongoose');

// Cache the database connection
let cachedConnection = null;

async function connectToDatabase() {
  // If we have a cached connection, return it
  if (cachedConnection) {
    return cachedConnection;
  }

  // Get the MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    // Connect to MongoDB with latest settings
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Connected to MongoDB database');
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Define the Weight Entry schema
const WeightEntrySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  date: { 
    type: Date, 
    required: true 
  },
  weight: { 
    type: Number, 
    required: true 
  },
  notes: { 
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

// Compound index to ensure user can't have duplicate dates
WeightEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// Create or retrieve the model
const getWeightEntryModel = () => {
  // Use existing model if it exists to prevent model overwrite warnings
  return mongoose.models.WeightEntry || mongoose.model('WeightEntry', WeightEntrySchema);
};

module.exports = {
  connectToDatabase,
  getWeightEntryModel
}; 