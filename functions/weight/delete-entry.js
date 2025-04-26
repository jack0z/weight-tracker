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
  
  // Get entry ID from the path
  const paths = event.path.split('/');
  const entryId = paths[paths.length - 1];
  
  if (!entryId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Entry ID is required' })
    };
  }
  
  // Get user ID from query string or body
  let userId = event.queryStringParameters?.userId;
  
  if (!userId && event.body) {
    try {
      const body = JSON.parse(event.body);
      userId = body.userId;
    } catch (error) {
      console.error('Error parsing request body:', error);
    }
  }
  
  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'User ID is required' })
    };
  }
  
  try {
    // Connect to database
    await connectToDatabase();
    const WeightEntry = getModel('WeightEntry');
    
    // Check if entry exists
    const entry = await WeightEntry.findOne({ _id: entryId, userId });
    
    if (!entry) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Entry not found' })
      };
    }
    
    // Delete the entry
    await WeightEntry.deleteOne({ _id: entryId, userId });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Entry deleted successfully',
        deletedEntryId: entryId
      })
    };
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting entry', error: error.message })
    };
  }
}; 