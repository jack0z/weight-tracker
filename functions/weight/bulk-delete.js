const { connectToDatabase, getModel } = require('../database/connection');

exports.handler = async (event, context) => {
  // Important: This prevents function timeout from waiting on MongoDB connection 
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only accept DELETE method
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const { userId, entryIds, deleteAll, startDate, endDate } = JSON.parse(event.body);
    
    // Validate user ID
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'User ID is required' })
      };
    }
    
    // Connect to database
    await connectToDatabase();
    const WeightEntry = getModel('WeightEntry');
    
    let query = { userId };
    let deletedCount = 0;
    
    // Handle different deletion scenarios
    if (deleteAll === true) {
      // Delete all entries for this user
      const result = await WeightEntry.deleteMany(query);
      deletedCount = result.deletedCount;
    } else if (Array.isArray(entryIds) && entryIds.length > 0) {
      // Delete specific entries by ID
      const result = await WeightEntry.deleteMany({
        userId,
        _id: { $in: entryIds }
      });
      deletedCount = result.deletedCount;
    } else if (startDate || endDate) {
      // Delete entries within a date range
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      const result = await WeightEntry.deleteMany(query);
      deletedCount = result.deletedCount;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: 'Invalid request. Provide entryIds, deleteAll=true, or date range'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'DELETE'
      },
      body: JSON.stringify({
        message: 'Bulk deletion completed',
        deletedCount
      })
    };
  } catch (error) {
    console.error('Error performing bulk delete:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error performing bulk delete', 
        error: error.message 
      })
    };
  }
};