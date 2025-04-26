const { MongoClient, ObjectId } = require('mongodb');

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
    const { userId, date, weight } = JSON.parse(event.body);
    
    // Validate required fields
    if (!userId || !date || !weight) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'userId, date, and weight are required' })
      };
    }

    // Validate weight is a number
    if (isNaN(parseFloat(weight))) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Weight must be a number' })
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

    // Check if an entry already exists for this date and user
    const existingEntry = await collection.findOne({ 
      userId, 
      date: new Date(date)
    });

    let result;
    let message;

    if (existingEntry) {
      // Update the existing entry
      result = await collection.updateOne(
        { _id: existingEntry._id },
        { $set: { weight: parseFloat(weight) } }
      );
      message = 'Weight entry updated';
    } else {
      // Create a new entry
      result = await collection.insertOne({
        userId,
        date: new Date(date),
        weight: parseFloat(weight),
        createdAt: new Date()
      });
      message = 'Weight entry added';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message,
        success: true,
        id: existingEntry ? existingEntry._id : result.insertedId
      })
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Error adding entry',
        error: error.message
      })
    };
  }
}; 