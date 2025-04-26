// scripts/init-database.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Define the WeightEntry model directly for testing
const weightEntrySchema = new mongoose.Schema({
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
    required: true,
    min: 0
  },
  note: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Add compound index to ensure each user can only have one entry per date
weightEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// Load the test data
const loadTestData = () => {
  try {
    const testDataPath = path.join(__dirname, 'test-data.json');
    
    if (fs.existsSync(testDataPath)) {
      const data = fs.readFileSync(testDataPath, 'utf8');
      return JSON.parse(data);
    }
    
    // If no test data file exists, create sample data
    const today = new Date();
    const sampleData = [];
    
    // Generate 30 days of sample data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Generate weight with some random variation around 75kg
      const weight = (75 + (Math.random() * 2 - 1)).toFixed(1);
      
      sampleData.push({
        userId: 'test-user',
        date,
        weight: parseFloat(weight),
        note: i === 0 ? 'Initial test entry' : ''
      });
    }
    
    // Save sample data to file for future use
    fs.writeFileSync(testDataPath, JSON.stringify(sampleData, null, 2), 'utf8');
    
    return sampleData;
  } catch (error) {
    console.error('Error loading test data:', error);
    return [];
  }
};

async function initDatabase() {
  console.log('Initializing database...');
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not defined');
    console.log('Please set the MONGODB_URI variable in your .env file');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    
    // Register the model
    const WeightEntry = mongoose.models.WeightEntry || mongoose.model('WeightEntry', weightEntrySchema);
    
    // Check if we have any entries
    const entryCount = await WeightEntry.countDocuments();
    console.log(`Found ${entryCount} existing entries`);
    
    // Load test data if no entries exist
    if (entryCount === 0) {
      console.log('No entries found. Loading test data...');
      
      const testData = loadTestData();
      
      if (testData.length > 0) {
        // Insert test data
        try {
          await WeightEntry.insertMany(testData, { ordered: false });
          console.log(`Successfully inserted ${testData.length} test entries`);
        } catch (error) {
          // Some entries might fail due to duplicate keys, which is OK
          if (error.name === 'BulkWriteError') {
            const inserted = error.insertedCount || 0;
            console.log(`Inserted ${inserted} test entries (some may have been skipped due to duplicates)`);
          } else {
            throw error;
          }
        }
      }
    }
    
    // Verify that we can query the data
    const recentEntries = await WeightEntry.find()
      .sort({ date: -1 })
      .limit(5);
    
    console.log('\nMost recent entries:');
    recentEntries.forEach(entry => {
      console.log(`- ${entry.date.toISOString().split('T')[0]}: ${entry.weight}kg ${entry.note ? `(${entry.note})` : ''}`);
    });
    
    console.log('\nDatabase initialization completed successfully!');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run the initialization
initDatabase().catch(console.error); 