const { connectToDatabase } = require('../database/connection');
require('../database/models/WeightEntry');
const mongoose = require('mongoose');
const WeightEntry = mongoose.model('WeightEntry');

/**
 * Handler for GET, POST, PUT, DELETE requests to /api/weight-entries
 */
exports.handler = async (event, context) => {
  // Make the function use the connection for the entire duration
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Parse the request path and method
  const path = event.path.replace('/.netlify/functions/weight-entries', '');
  const segments = path.split('/').filter(Boolean);
  const method = event.httpMethod;
  
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get user ID from authentication (implement your auth method)
    // This is a placeholder - you should integrate with your auth system
    const userId = event.headers.authorization || 'anonymous-user';
    
    // Handle different HTTP methods
    if (method === 'GET') {
      return await handleGet(segments, userId, event);
    } else if (method === 'POST') {
      return await handlePost(userId, event);
    } else if (method === 'PUT') {
      return await handlePut(segments, userId, event);
    } else if (method === 'DELETE') {
      return await handleDelete(segments, userId, event);
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};

/**
 * Handle GET requests
 */
async function handleGet(segments, userId, event) {
  // If an ID is provided, get a specific entry
  if (segments.length > 0) {
    const entryId = segments[0];
    try {
      const entry = await WeightEntry.findOne({ 
        _id: entryId,
        userId: userId 
      });
      
      if (!entry) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Entry not found' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify(entry)
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid entry ID', error: error.message })
      };
    }
  }
  
  // Get query parameters
  const queryParams = event.queryStringParameters || {};
  const limit = parseInt(queryParams.limit) || 100;
  const skip = parseInt(queryParams.skip) || 0;
  
  // Parse date filters if provided
  let dateFilter = {};
  if (queryParams.startDate) {
    dateFilter.$gte = new Date(queryParams.startDate);
  }
  if (queryParams.endDate) {
    dateFilter.$lte = new Date(queryParams.endDate);
  }
  
  // Build the query
  const query = { userId };
  if (Object.keys(dateFilter).length > 0) {
    query.date = dateFilter;
  }
  
  // Get entries with pagination
  const entries = await WeightEntry.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await WeightEntry.countDocuments(query);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      entries,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + entries.length < total
      }
    })
  };
}

/**
 * Handle POST requests to create a new entry
 */
async function handlePost(userId, event) {
  try {
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.date || !data.weight) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Date and weight are required' })
      };
    }
    
    // Check if an entry for this date already exists
    const existingEntry = await WeightEntry.findOne({
      userId,
      date: new Date(data.date)
    });
    
    if (existingEntry) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'An entry for this date already exists' })
      };
    }
    
    // Create new entry
    const entry = new WeightEntry({
      userId,
      date: new Date(data.date),
      weight: data.weight,
      note: data.note || ''
    });
    
    await entry.save();
    
    return {
      statusCode: 201,
      body: JSON.stringify(entry)
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request data', error: error.message })
    };
  }
}

/**
 * Handle PUT requests to update an entry
 */
async function handlePut(segments, userId, event) {
  if (segments.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Entry ID is required' })
    };
  }
  
  const entryId = segments[0];
  
  try {
    const data = JSON.parse(event.body);
    
    // Find the entry
    const entry = await WeightEntry.findOne({ 
      _id: entryId,
      userId 
    });
    
    if (!entry) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Entry not found' })
      };
    }
    
    // Update fields
    if (data.date) entry.date = new Date(data.date);
    if (data.weight !== undefined) entry.weight = data.weight;
    if (data.note !== undefined) entry.note = data.note;
    
    await entry.save();
    
    return {
      statusCode: 200,
      body: JSON.stringify(entry)
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request data', error: error.message })
    };
  }
}

/**
 * Handle DELETE requests to remove an entry
 */
async function handleDelete(segments, userId, event) {
  if (segments.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Entry ID is required' })
    };
  }
  
  const entryId = segments[0];
  
  try {
    const result = await WeightEntry.deleteOne({ 
      _id: entryId,
      userId 
    });
    
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Entry not found' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Entry deleted successfully' })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid entry ID', error: error.message })
    };
  }
} 