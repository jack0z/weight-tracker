/**
 * Weight Entries API
 * Handles CRUD operations for weight entries
 */
const { connectToDatabase } = require('./utils/database');
const { 
  formatSuccessResponse, 
  formatErrorResponse, 
  getCorsHeaders,
  handleCorsPreflightRequest
} = require('./utils/response');

// Dynamically import the model to avoid issues with mongoose instantiation
let WeightEntry;

/**
 * Main handler for weight-entries endpoint
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Connect to database
    await connectToDatabase();
    
    // Import model after connection
    if (!WeightEntry) {
      WeightEntry = require('./database/models/WeightEntry');
    }
    
    // Route based on HTTP method
    switch (event.httpMethod) {
      case 'GET':
        return await getEntries(event);
      case 'POST':
        return await createEntry(event);
      case 'PUT':
        return await updateEntry(event);
      case 'DELETE':
        return await deleteEntry(event);
      default:
        return formatErrorResponse('Method not supported', 405);
    }
  } catch (error) {
    console.error('Error in weight-entries handler:', error);
    return formatErrorResponse(
      'Server error processing request',
      500,
      process.env.NODE_ENV === 'development' ? error.message : null
    );
  }
};

/**
 * Get weight entries
 * Supports filtering by date range and userId
 */
async function getEntries(event) {
  try {
    const params = event.queryStringParameters || {};
    const userId = params.userId;
    
    if (!userId) {
      return formatErrorResponse('userId is required', 400);
    }

    const startDate = params.startDate ? new Date(params.startDate) : null;
    const endDate = params.endDate ? new Date(params.endDate) : null;
    const limit = params.limit ? parseInt(params.limit, 10) : 100;

    let query = { userId };
    
    // Add date range to query if provided
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    const entries = await WeightEntry.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .exec();

    return formatSuccessResponse({ entries });
  } catch (error) {
    console.error('Error getting entries:', error);
    return formatErrorResponse('Failed to retrieve entries', 500);
  }
}

/**
 * Create a new weight entry
 */
async function createEntry(event) {
  try {
    const data = JSON.parse(event.body);
    
    if (!data.userId || !data.date || data.weight === undefined) {
      return formatErrorResponse('Missing required fields: userId, date, and weight are required', 400);
    }

    // Convert string date to Date object if needed
    if (typeof data.date === 'string') {
      data.date = new Date(data.date);
    }

    // Check for existing entry on the same date
    const existingEntry = await WeightEntry.findOne({
      userId: data.userId,
      date: {
        $gte: new Date(data.date.setHours(0, 0, 0, 0)),
        $lt: new Date(data.date.setHours(23, 59, 59, 999))
      }
    });

    if (existingEntry) {
      return formatErrorResponse('Entry already exists for this date', 409);
    }

    const entry = new WeightEntry(data);
    await entry.save();

    return formatSuccessResponse({ entry }, 201);
  } catch (error) {
    console.error('Error creating entry:', error);
    return formatErrorResponse(
      'Failed to create entry', 
      500, 
      error.name === 'ValidationError' ? error.message : null
    );
  }
}

/**
 * Update an existing weight entry
 */
async function updateEntry(event) {
  try {
    const data = JSON.parse(event.body);
    const entryId = event.queryStringParameters?.id;
    
    if (!entryId) {
      return formatErrorResponse('Entry ID is required', 400);
    }

    if (!data.userId) {
      return formatErrorResponse('userId is required', 400);
    }

    // Find entry and validate ownership
    const entry = await WeightEntry.findById(entryId);
    
    if (!entry) {
      return formatErrorResponse('Entry not found', 404);
    }
    
    if (entry.userId !== data.userId) {
      return formatErrorResponse('Unauthorized to update this entry', 403);
    }

    // Only update fields that are provided
    if (data.weight !== undefined) entry.weight = data.weight;
    if (data.note !== undefined) entry.note = data.note;
    if (data.date) entry.date = new Date(data.date);

    await entry.save();
    
    return formatSuccessResponse({ entry });
  } catch (error) {
    console.error('Error updating entry:', error);
    return formatErrorResponse(
      'Failed to update entry', 
      500, 
      error.name === 'ValidationError' ? error.message : null
    );
  }
}

/**
 * Delete a weight entry
 */
async function deleteEntry(event) {
  try {
    const entryId = event.queryStringParameters?.id;
    const userId = event.queryStringParameters?.userId;
    
    if (!entryId || !userId) {
      return formatErrorResponse('Entry ID and userId are required', 400);
    }

    // Find entry and validate ownership
    const entry = await WeightEntry.findById(entryId);
    
    if (!entry) {
      return formatErrorResponse('Entry not found', 404);
    }
    
    if (entry.userId !== userId) {
      return formatErrorResponse('Unauthorized to delete this entry', 403);
    }

    await WeightEntry.findByIdAndDelete(entryId);
    
    return formatSuccessResponse({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return formatErrorResponse('Failed to delete entry', 500);
  }
} 