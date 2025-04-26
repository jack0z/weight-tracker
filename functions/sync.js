/**
 * Sync API
 * Handles synchronization between local storage and database
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
 * Main handler for sync API
 */
exports.handler = async (event, context) => {
  // For OPTIONS requests (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // Only allow POST for sync operations
  if (event.httpMethod !== 'POST') {
    return formatErrorResponse('Method not allowed', 405);
  }

  // Get userId from Authorization header or query param (for demo purposes)
  const authHeader = event.headers.authorization;
  const userId = authHeader 
    ? authHeader.replace('Bearer ', '') 
    : event.queryStringParameters?.userId || 'demo-user';

  try {
    // Connect to the database
    await connectToDatabase();
    
    // Parse request body
    const { localEntries, lastSyncTimestamp } = JSON.parse(event.body);
    
    // Validate request
    if (!Array.isArray(localEntries)) {
      return formatErrorResponse('Local entries must be an array', 400);
    }
    
    // Get server entries modified since last sync
    const serverEntries = await getServerEntries(userId, lastSyncTimestamp);
    
    // Process local entries (create or update)
    const syncResult = await processLocalEntries(userId, localEntries);
    
    return formatSuccessResponse({
      message: 'Sync completed successfully',
      serverEntries,
      created: syncResult.created,
      updated: syncResult.updated,
      errors: syncResult.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in sync function:', error);
    return formatErrorResponse(
      'An error occurred during synchronization',
      500,
      { details: error.message }
    );
  }
};

/**
 * Get server entries that were modified since the last sync
 */
async function getServerEntries(userId, lastSyncTimestamp) {
  const query = { userId };
  
  // Add timestamp filter if provided
  if (lastSyncTimestamp) {
    const lastSync = new Date(lastSyncTimestamp);
    if (!isNaN(lastSync.getTime())) {
      query.updatedAt = { $gt: lastSync };
    }
  }
  
  return await WeightEntry.find(query).sort({ date: -1 });
}

/**
 * Process local entries by creating or updating them in the database
 */
async function processLocalEntries(userId, localEntries) {
  const result = {
    created: 0,
    updated: 0,
    errors: []
  };
  
  // Process each entry
  for (const entry of localEntries) {
    try {
      // Skip invalid entries
      if (!entry.date || entry.weight === undefined) {
        result.errors.push({
          entry,
          error: 'Missing required fields (date or weight)'
        });
        continue;
      }
      
      // Prepare the entry with proper userId
      const entryData = {
        ...entry,
        userId,
        date: new Date(entry.date),
        weight: parseFloat(entry.weight),
        note: entry.note || ''
      };
      
      // Try to find an existing entry for this date
      const existingEntry = await WeightEntry.findOne({
        userId,
        date: {
          $gte: new Date(new Date(entry.date).setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(entry.date).setHours(23, 59, 59, 999))
        }
      });
      
      if (existingEntry) {
        // Update existing entry
        await WeightEntry.updateOne(
          { _id: existingEntry._id },
          { $set: entryData }
        );
        result.updated++;
      } else {
        // Create new entry
        await WeightEntry.create(entryData);
        result.created++;
      }
    } catch (error) {
      console.error(`Error processing entry ${JSON.stringify(entry)}:`, error);
      result.errors.push({
        entry,
        error: error.message
      });
    }
  }
  
  return result;
} 