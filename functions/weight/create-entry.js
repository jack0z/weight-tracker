const { connectToDatabase, getModel } = require('../database/connection');

exports.handler = async (event, context) => {
  // Make the function use the same database connection on warm starts
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  try {
    // Parse request body
    const { userId, date, weight } = JSON.parse(event.body);
    
    // Validate required fields
    if (!userId || !date || weight === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields', 
          required: ['userId', 'date', 'weight'] 
        })
      };
    }
    
    // Validate weight is a number
    if (isNaN(parseFloat(weight))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Weight must be a valid number' })
      };
    }
    
    // Connect to database
    await connectToDatabase();
    const WeightEntry = getModel('WeightEntry');
    
    // Check if an entry with the same date already exists
    const existingEntry = await WeightEntry.findOne({ 
      userId, 
      date: new Date(date)
    });
    
    if (existingEntry) {
      return {
        statusCode: 409,
        body: JSON.stringify({ 
          error: 'Entry already exists for this date',
          existingEntry
        })
      };
    }
    
    // Create new entry
    const newEntry = new WeightEntry({
      userId,
      date: new Date(date),
      weight: parseFloat(weight)
    });
    
    // Save to database
    await newEntry.save();
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify(newEntry.toObject())
    };
  } catch (error) {
    console.error('Error creating weight entry:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create weight entry' })
    };
  }
}; 