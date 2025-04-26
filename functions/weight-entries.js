const { connectToDatabase } = require('./database/connection');
require('./database/models/WeightEntry'); // Make sure the model is loaded
const mongoose = require('mongoose');
const WeightEntry = mongoose.model('WeightEntry');

/**
 * Handler for Netlify serverless function
 * @param {Object} event - The Netlify event object
 * @param {Object} context - The Netlify context object
 * @returns {Promise<Object>} The response object
 */
exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // Verify authentication (simplified for now)
  const userId = event.headers.authorization || 'default-user';
  
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Route based on HTTP method
    switch (event.httpMethod) {
      case 'GET':
        return await getEntries(userId, event, headers);
      case 'POST':
        return await createEntry(userId, event, headers);
      case 'PUT':
        return await updateEntry(userId, event, headers);
      case 'DELETE':
        return await deleteEntry(userId, event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in weight-entries function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};

/**
 * Get weight entries for a user
 * @param {string} userId - The user ID
 * @param {Object} event - The Netlify event object
 * @param {Object} headers - Response headers
 * @returns {Promise<Object>} The response object
 */
async function getEntries(userId, event, headers) {
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 100;
    const skip = parseInt(queryParams.skip) || 0;
    
    // Prepare find query with userId
    const query = { userId };
    
    // Add date range filter if provided
    if (queryParams.startDate) {
      query.date = query.date || {};
      query.date.$gte = new Date(queryParams.startDate);
    }
    
    if (queryParams.endDate) {
      query.date = query.date || {};
      query.date.$lte = new Date(queryParams.endDate);
    }

    // Get total count for pagination
    const total = await WeightEntry.countDocuments(query);
    
    // Execute the query with pagination
    const entries = await WeightEntry.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        entries,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > (skip + limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting entries:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to get entries', error: error.message })
    };
  }
}

/**
 * Create a new weight entry
 * @param {string} userId - The user ID
 * @param {Object} event - The Netlify event object
 * @param {Object} headers - Response headers
 * @returns {Promise<Object>} The response object
 */
async function createEntry(userId, event, headers) {
  try {
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.date || !data.weight) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Date and weight are required fields' })
      };
    }

    // Parse the date
    const entryDate = new Date(data.date);
    if (isNaN(entryDate.getTime())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid date format' })
      };
    }

    // Create the entry
    const entry = new WeightEntry({
      userId,
      date: entryDate,
      weight: parseFloat(data.weight),
      note: data.note || ''
    });

    // Save to database
    await entry.save();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Entry created successfully',
        entry
      })
    };
  } catch (error) {
    // Handle duplicate entry error
    if (error.code === 11000) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ message: 'An entry for this date already exists' })
      };
    }

    console.error('Error creating entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to create entry', error: error.message })
    };
  }
}

/**
 * Update an existing weight entry
 * @param {string} userId - The user ID
 * @param {Object} event - The Netlify event object
 * @param {Object} headers - Response headers
 * @returns {Promise<Object>} The response object
 */
async function updateEntry(userId, event, headers) {
  try {
    const data = JSON.parse(event.body);
    
    // Validate the ID
    if (!data.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Entry ID is required' })
      };
    }

    // Find and update the entry
    const updatedEntry = await WeightEntry.findOneAndUpdate(
      { _id: data.id, userId },
      { 
        $set: { 
          weight: parseFloat(data.weight),
          note: data.note
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Entry not found or not authorized' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Entry updated successfully',
        entry: updatedEntry
      })
    };
  } catch (error) {
    console.error('Error updating entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to update entry', error: error.message })
    };
  }
}

/**
 * Delete a weight entry
 * @param {string} userId - The user ID
 * @param {Object} event - The Netlify event object
 * @param {Object} headers - Response headers
 * @returns {Promise<Object>} The response object
 */
async function deleteEntry(userId, event, headers) {
  try {
    const params = event.queryStringParameters;
    
    // Validate the ID
    if (!params || !params.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Entry ID is required' })
      };
    }

    // Find and delete the entry
    const deletedEntry = await WeightEntry.findOneAndDelete({
      _id: params.id,
      userId
    });

    if (!deletedEntry) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'Entry not found or not authorized' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Entry deleted successfully',
        entry: deletedEntry
      })
    };
  } catch (error) {
    console.error('Error deleting entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to delete entry', error: error.message })
    };
  }
} 