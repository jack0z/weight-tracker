/**
 * Weight Entry API Endpoints
 * Handles CRUD operations for weight entries
 */

const { connectToDatabase } = require('./utils/database');
const WeightEntry = require('./database/models/WeightEntry');
const { 
  getCorsHeaders, 
  handleCorsPreflightRequest,
  formatSuccessResponse,
  formatErrorResponse
} = require('./utils/response');

/**
 * Main handler for weight entry operations
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Get user ID from authentication context (simplified for demo)
  // In a production app, this would come from an auth service like Auth0 or Netlify Identity
  const userId = event.headers.authorization || 'demo-user';
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Route based on HTTP method
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
    console.error('Error in weight API:', error);
    return formatErrorResponse('Server error', 500, error.message);
  }
};

/**
 * Get weight entries for a user
 * Supports date range filtering via query parameters
 */
async function getWeightEntries(event, userId) {
  // Parse query parameters
  const params = new URLSearchParams(event.queryStringParameters || {});
  const startDate = params.get('startDate') ? new Date(params.get('startDate')) : null;
  const endDate = params.get('endDate') ? new Date(params.get('endDate')) : null;
  const limit = parseInt(params.get('limit') || '100', 10);
  
  // Build query
  const query = { userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  // Execute query
  const entries = await WeightEntry.find(query)
    .sort({ date: -1 })
    .limit(limit);
  
  return formatSuccessResponse({ entries });
}

/**
 * Create a new weight entry
 */
async function createWeightEntry(event, userId) {
  // Parse request body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return formatErrorResponse('Invalid JSON in request body', 400);
  }
  
  // Validate required fields
  if (!data.date || !data.weight) {
    return formatErrorResponse('Date and weight are required', 400);
  }
  
  // Check if an entry already exists for this date
  const existingEntry = await WeightEntry.findOne({
    userId,
    date: new Date(data.date)
  });
  
  if (existingEntry) {
    return formatErrorResponse('An entry already exists for this date', 409);
  }
  
  // Create new entry
  const weightEntry = new WeightEntry({
    userId,
    date: new Date(data.date),
    weight: parseFloat(data.weight),
    note: data.note || ''
  });
  
  // Save to database
  await weightEntry.save();
  
  return formatSuccessResponse({ entry: weightEntry }, 201);
}

/**
 * Update an existing weight entry
 */
async function updateWeightEntry(event, userId) {
  // Parse request body
  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return formatErrorResponse('Invalid JSON in request body', 400);
  }
  
  // Validate required fields
  if (!data.date) {
    return formatErrorResponse('Date is required to identify the entry', 400);
  }
  
  // Find the entry
  const entry = await WeightEntry.findOne({
    userId,
    date: new Date(data.date)
  });
  
  if (!entry) {
    return formatErrorResponse('Entry not found', 404);
  }
  
  // Update fields
  if (data.weight !== undefined) {
    entry.weight = parseFloat(data.weight);
  }
  
  if (data.note !== undefined) {
    entry.note = data.note;
  }
  
  // Save changes
  await entry.save();
  
  return formatSuccessResponse({ entry });
}

/**
 * Delete a weight entry
 */
async function deleteWeightEntry(event, userId) {
  // Parse request parameters
  const params = new URLSearchParams(event.queryStringParameters || {});
  const date = params.get('date');
  
  if (!date) {
    return formatErrorResponse('Date parameter is required', 400);
  }
  
  // Delete the entry
  const result = await WeightEntry.deleteOne({
    userId,
    date: new Date(date)
  });
  
  if (result.deletedCount === 0) {
    return formatErrorResponse('Entry not found', 404);
  }
  
  return formatSuccessResponse({ success: true });
} 