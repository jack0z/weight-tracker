/**
 * Weight Entry API
 * Handles CRUD operations for weight entries
 */

const { connectToDatabase } = require('./database/connection');
const WeightEntry = require('./database/models/WeightEntry');
const { 
  getCorsHeaders,
  handleCorsPreflightRequest,
  formatSuccessResponse,
  formatErrorResponse
} = require('./utils/response');

/**
 * Main handler for weight entry API
 * Supports GET, POST, PUT, DELETE methods
 */
exports.handler = async (event, context) => {
  // For OPTIONS requests (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Get userId from Authorization header or query param (for demo purposes)
  const authHeader = event.headers.authorization;
  const userId = authHeader 
    ? authHeader.replace('Bearer ', '') 
    : event.queryStringParameters?.userId || 'demo-user';

  try {
    // Connect to the database
    await connectToDatabase();

    // Route to the appropriate handler based on HTTP method
    switch (event.httpMethod) {
      case 'GET':
        return await getWeightEntries(event, userId);
      case 'POST':
        return await createWeightEntry(event, userId);
      case 'PUT':
        return await updateWeightEntry(event, userId);
      case 'DELETE':
        return await deleteWeightEntry(event, userId);
      default:
        return formatErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Error in weight-entry function:', error);
    return formatErrorResponse(
      'An error occurred processing your request',
      500,
      { details: error.message }
    );
  }
};

/**
 * Get weight entries for a user
 * Supports date range filtering
 */
async function getWeightEntries(event, userId) {
  try {
    const { startDate, endDate, limit } = event.queryStringParameters || {};
    let query = { userId };

    // Add date range filtering if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Query the database with optional limit
    const entries = await WeightEntry.find(query)
      .sort({ date: -1 })
      .limit(limit ? parseInt(limit) : 100);

    return formatSuccessResponse({ entries });
  } catch (error) {
    return formatErrorResponse('Error retrieving weight entries', 400, { details: error.message });
  }
}

/**
 * Create a new weight entry
 */
async function createWeightEntry(event, userId) {
  try {
    const { date, weight, note } = JSON.parse(event.body);

    // Validate required fields
    if (!date || !weight) {
      return formatErrorResponse('Date and weight are required fields', 400);
    }

    // Create the entry
    const entry = new WeightEntry({
      userId,
      date: new Date(date),
      weight: parseFloat(weight),
      note: note || ''
    });

    // Save to database
    const savedEntry = await entry.save();
    
    return formatSuccessResponse({ entry: savedEntry }, 201);
  } catch (error) {
    // Handle duplicate entry error
    if (error.code === 11000) {
      return formatErrorResponse('An entry already exists for this date', 409);
    }
    
    return formatErrorResponse('Error creating weight entry', 400, { details: error.message });
  }
}

/**
 * Update an existing weight entry
 */
async function updateWeightEntry(event, userId) {
  try {
    const { id, date, weight, note } = JSON.parse(event.body);
    
    if (!id) {
      return formatErrorResponse('Entry ID is required', 400);
    }

    // Prepare update data
    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (note !== undefined) updateData.note = note;

    // Update the entry
    const updatedEntry = await WeightEntry.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return formatErrorResponse('Entry not found or you do not have permission to modify it', 404);
    }

    return formatSuccessResponse({ entry: updatedEntry });
  } catch (error) {
    return formatErrorResponse('Error updating weight entry', 400, { details: error.message });
  }
}

/**
 * Delete a weight entry
 */
async function deleteWeightEntry(event, userId) {
  try {
    const { id } = event.queryStringParameters || {};
    
    if (!id) {
      return formatErrorResponse('Entry ID is required', 400);
    }

    // Delete the entry
    const deletedEntry = await WeightEntry.findOneAndDelete({ _id: id, userId });

    if (!deletedEntry) {
      return formatErrorResponse('Entry not found or you do not have permission to delete it', 404);
    }

    return formatSuccessResponse({ message: 'Entry deleted successfully' });
  } catch (error) {
    return formatErrorResponse('Error deleting weight entry', 400, { details: error.message });
  }
} 