const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

exports.handler = async function(event, context) {
  // Set context.callbackWaitsForEmptyEventLoop to false to keep the connection open
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow DELETE requests
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Parse the entry ID and userId from the query parameters
    const { id, userId } = event.queryStringParameters || {};
    
    if (!id || !userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Entry ID and userId are required' })
      };
    }

    // Connect to MongoDB
    if (!cachedClient) {
      const client = new MongoClient(uri);
      await client.connect();
      cachedClient = client;
      console.log('Connected to MongoDB');
    }

    // Access the database
    const db = cachedClient.db('weight_tracker');
    const collection = db.collection('weight_entries');

    // Delete the entry
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      userId // Ensure the entry belongs to the user
    });

    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Entry not found or not owned by user' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Weight entry deleted',
        success: true
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Error deleting entry',
        error: error.message
      })
    };
  }
}; 