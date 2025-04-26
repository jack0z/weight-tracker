/**
 * API client for interacting with weight-tracking serverless functions
 */

// Base URL for API endpoints - will use relative paths in browser
const API_BASE = '/.netlify/functions';

/**
 * Gets the user's ID from local storage or generates a new one
 * @returns {string} The user ID
 */
function getUserId() {
  // In a real app, this would come from authentication
  let userId = localStorage.getItem('weightTrackerId');
  
  if (!userId) {
    // Generate a simple ID if none exists
    userId = 'user_' + Date.now();
    localStorage.setItem('weightTrackerId', userId);
  }
  
  return userId;
}

/**
 * Makes an API request with proper headers
 * @param {string} endpoint - The API endpoint
 * @param {string} method - The HTTP method
 * @param {Object} [data] - Optional data for POST/PUT requests
 * @returns {Promise<Object>} The API response
 */
async function apiRequest(endpoint, method, data = null) {
  const url = `${API_BASE}/${endpoint}`;
  const userId = getUserId();
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': userId
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const jsonResponse = await response.json();
    
    if (!response.ok) {
      // Format error with status code
      const error = new Error(jsonResponse.message || 'API request failed');
      error.status = response.status;
      error.data = jsonResponse;
      throw error;
    }
    
    return jsonResponse;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error);
    throw error;
  }
}

/**
 * Gets all weight entries for the current user
 * @param {Object} [options] - Optional parameters
 * @param {number} [options.limit] - Maximum number of entries to return
 * @returns {Promise<Array>} List of weight entries
 */
export async function getWeightEntries(options = {}) {
  const params = new URLSearchParams();
  
  if (options.limit) {
    params.append('limit', options.limit);
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`weight-entries${queryString}`, 'GET');
}

/**
 * Gets weight entries within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {number} [limit] - Maximum number of entries to return
 * @returns {Promise<Array>} List of weight entries
 */
export async function getWeightEntriesByDateRange(startDate, endDate, limit = 100) {
  const params = new URLSearchParams({
    startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
    endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
    limit: limit.toString()
  });
  
  return apiRequest(`weight-entries?${params.toString()}`, 'GET');
}

/**
 * Gets a specific weight entry by ID
 * @param {string} id - Entry ID
 * @returns {Promise<Object>} The weight entry
 */
export async function getWeightEntry(id) {
  return apiRequest(`weight-entries?id=${id}`, 'GET');
}

/**
 * Creates a new weight entry
 * @param {Object} entry - The weight entry data
 * @param {Date|string} entry.date - Date of the entry
 * @param {number} entry.weight - Weight value
 * @param {string} [entry.note] - Optional note
 * @returns {Promise<Object>} The created entry
 */
export async function createWeightEntry(entry) {
  return apiRequest('weight-entries', 'POST', entry);
}

/**
 * Updates an existing weight entry
 * @param {string} id - Entry ID
 * @param {Object} updates - Fields to update
 * @param {Date|string} [updates.date] - New date
 * @param {number} [updates.weight] - New weight
 * @param {string} [updates.note] - New note
 * @returns {Promise<Object>} The updated entry
 */
export async function updateWeightEntry(id, updates) {
  return apiRequest(`weight-entries?id=${id}`, 'PUT', updates);
}

/**
 * Deletes a weight entry
 * @param {string} id - Entry ID to delete
 * @returns {Promise<Object>} Confirmation response
 */
export async function deleteWeightEntry(id) {
  return apiRequest(`weight-entries?id=${id}`, 'DELETE');
}

/**
 * Syncs local storage entries with the database
 * @param {Array} localEntries - Entries from local storage
 * @returns {Promise<Array>} Merged and synchronized entries
 */
export async function syncEntries(localEntries) {
  try {
    // Get all entries from the server
    const serverEntries = await getWeightEntries();
    
    // Create a map of server entries by date
    const serverEntriesByDate = new Map();
    serverEntries.forEach(entry => {
      serverEntriesByDate.set(new Date(entry.date).toISOString().split('T')[0], entry);
    });
    
    // Track new entries to create on the server
    const entriesToCreate = [];
    
    // Process local entries
    for (const localEntry of localEntries) {
      const dateKey = new Date(localEntry.date).toISOString().split('T')[0];
      
      // If entry doesn't exist on server, add it to create list
      if (!serverEntriesByDate.has(dateKey)) {
        entriesToCreate.push(localEntry);
      }
    }
    
    // Create new entries on the server
    for (const entry of entriesToCreate) {
      await createWeightEntry(entry);
    }
    
    // Return refreshed list of entries
    return await getWeightEntries();
  } catch (error) {
    console.error('Error syncing entries:', error);
    // If sync fails, return the original local entries
    return localEntries;
  }
} 