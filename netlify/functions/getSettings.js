const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

exports.handler = async function(event, context) {
  // Set context.callbackWaitsForEmptyEventLoop to false to keep the connection open
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  // Get userId from query parameters
  const { userId } = event.queryStringParameters || {};
  
  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'userId is required' })
    };
  }

  try {
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

    // Get user settings
    const settings = await collection.findOne({ userId });

    // If no settings found, return empty defaults
    if (!settings) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          settings: {
            startWeight: null,
            goalWeight: null,
            height: null
          }
        })
      };
    }

    // Return user settings
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        settings: {
          startWeight: settings.startWeight,
          goalWeight: settings.goalWeight,
          height: settings.height
        }
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Error retrieving settings',
        error: error.message
      })
    };
  }
}; 