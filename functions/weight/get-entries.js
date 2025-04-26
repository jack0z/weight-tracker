const { connectToDatabase, getModel } = require('../database/connection');

exports.handler = async (event, context) => {
  // Make the function use the same database connection on warm starts
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Parse query parameters
    const { userId, startDate, endDate, limit = '100', skip = '0' } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }
    
    // Connect to database
    await connectToDatabase();
    const WeightEntry = getModel('WeightEntry');
    
    // Build the query
    const query = { userId };
    
    // Add date filtering if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const entries = await WeightEntry.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    // Get total count for pagination
    const total = await WeightEntry.countDocuments(query);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET'
      },
      body: JSON.stringify({
        entries,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip)
        }
      })
    };
  } catch (error) {
    console.error('Error getting weight entries:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve weight entries' })
    };
  }
}; 