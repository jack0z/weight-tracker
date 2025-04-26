const { MongoClient } = require('mongodb');
require('dotenv').config();

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db('weight-tracker');
    cachedDb = { client, database };
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Make sure the function is called with the proper method
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET' && event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // For local development, enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight response' }),
    };
  }

  try {
    // Connect to database
    const { database } = await connectToDatabase();
    const collection = database.collection('weight-entries');

    // Handle different operations based on the action parameter
    const action = event.queryStringParameters?.action || 'get';

    switch (action) {
      case 'get':
        // Get all weight entries for the user
        const getUserId = event.queryStringParameters?.userId || 'anonymous';
        const entries = await collection.find({ userId: getUserId }).sort({ date: -1 }).toArray();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ entries }),
        };

      case 'add':
        // Add a new weight entry
        const body = JSON.parse(event.body);
        const { date, weight, userId = 'anonymous' } = body;
        
        if (!date || !weight) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Date and weight are required' }),
          };
        }

        // Check if an entry for this date already exists
        const existingEntry = await collection.findOne({ 
          userId, 
          date: new Date(date).toISOString().split('T')[0] 
        });

        if (existingEntry) {
          // Update existing entry
          await collection.updateOne(
            { _id: existingEntry._id },
            { $set: { weight: parseFloat(weight) } }
          );
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Entry updated successfully', updated: true }),
          };
        } else {
          // Insert new entry
          const newEntry = {
            userId,
            date: new Date(date).toISOString().split('T')[0],
            weight: parseFloat(weight),
            created: new Date().toISOString(),
          };
          
          await collection.insertOne(newEntry);
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ message: 'Entry added successfully', entry: newEntry }),
          };
        }

      case 'delete':
        // Delete a specific weight entry
        const deleteBody = JSON.parse(event.body);
        const { entryId, deleteUserId = 'anonymous' } = deleteBody;
        
        if (!entryId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Entry ID is required' }),
          };
        }
        
        await collection.deleteOne({ _id: entryId, userId: deleteUserId });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Entry deleted successfully' }),
        };

      case 'clear':
        // Clear all entries for a user
        const clearBody = JSON.parse(event.body);
        const { clearUserId = 'anonymous' } = clearBody;
        
        const result = await collection.deleteMany({ userId: clearUserId });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'All entries cleared successfully', 
            deleted: result.deletedCount 
          }),
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Database operation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message }),
    };
  }
}; 