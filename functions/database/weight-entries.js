const { connectToDatabase, getWeightEntryModel } = require('../../utils/database');

exports.handler = async (event, context) => {
  // Don't wait for empty event loop to prevent timeout issues with MongoDB
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    // Connect to database
    await connectToDatabase();
    const WeightEntry = getWeightEntryModel();
    
    // Get userId from query parameters or request body
    const userId = event.queryStringParameters?.userId || 
                  (event.body ? JSON.parse(event.body).userId : null);
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // GET - Retrieve entries
    if (event.httpMethod === 'GET') {
      const entries = await WeightEntry.find({ userId })
        .sort({ date: -1 })
        .lean();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(entries)
      };
    }
    
    // POST - Create a new entry
    if (event.httpMethod === 'POST') {
      const { date, weight, notes } = JSON.parse(event.body);
      
      // Validate required fields
      if (!date || !weight) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'date and weight are required' })
        };
      }
      
      // Check for existing entry with same date
      const existingEntry = await WeightEntry.findOne({
        userId,
        date: new Date(date)
      });
      
      if (existingEntry) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'An entry for this date already exists' })
        };
      }
      
      // Create new entry
      const entry = new WeightEntry({
        userId,
        date: new Date(date),
        weight: parseFloat(weight),
        notes: notes || ''
      });
      
      await entry.save();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(entry)
      };
    }
    
    // PUT - Update an entry
    if (event.httpMethod === 'PUT') {
      const { id, date, weight, notes } = JSON.parse(event.body);
      
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Entry id is required' })
        };
      }
      
      const entry = await WeightEntry.findOneAndUpdate(
        { _id: id, userId },
        { 
          date: new Date(date),
          weight: parseFloat(weight),
          notes: notes || ''
        },
        { new: true }
      );
      
      if (!entry) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Entry not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(entry)
      };
    }
    
    // DELETE - Remove an entry
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Entry id is required' })
        };
      }
      
      const result = await WeightEntry.findOneAndDelete({ _id: id, userId });
      
      if (!result) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Entry not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Entry deleted successfully' })
      };
    }
    
    // DELETE with clearAll parameter - Remove all entries for user
    if (event.httpMethod === 'DELETE' && event.queryStringParameters?.clearAll === 'true') {
      const result = await WeightEntry.deleteMany({ userId });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'All entries deleted successfully',
          count: result.deletedCount
        })
      };
    }
    
    // Method not supported
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Database function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Server error',
        message: error.message
      })
    };
  }
}; 