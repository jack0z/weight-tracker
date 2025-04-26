const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

exports.handler = async function(event, context) {
  // Set context.callbackWaitsForEmptyEventLoop to false to keep the connection open
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { userId, startWeight, goalWeight, height } = JSON.parse(event.body);
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'userId is required' })
      };
    }

    // Convert numeric values if they exist
    const settings = {};
    if (startWeight !== undefined) settings.startWeight = parseFloat(startWeight);
    if (goalWeight !== undefined) settings.goalWeight = parseFloat(goalWeight);
    if (height !== undefined) settings.height = parseFloat(height);

    // Connect to MongoDB
    if (!cachedClient) {
      const client = new MongoClient(uri);
      await client.connect();
      cachedClient = client;
      console.log('Connected to MongoDB');
    }

    // Access the database
    const db = cachedClient.db('weight_tracker');
    const collection = db.collection('user_settings');

    // Check if user settings already exist
    const existingSettings = await collection.findOne({ userId });

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await collection.updateOne(
        { userId },
        { $set: settings }
      );
    } else {
      // Create new settings document
      result = await collection.insertOne({
        userId,
        ...settings,
        createdAt: new Date()
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Settings saved successfully',
        success: true
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Error saving settings',
        error: error.message
      })
    };
  }
}; 