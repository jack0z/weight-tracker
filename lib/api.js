/**
 * API service for weight entries
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Check if we're running on the server
 * @returns {boolean}
 */
const isServer = () => typeof window === 'undefined';

/**
 * Get the current user ID
 * @returns {string|null}
 */
const getUserId = () => {
  if (isServer()) return null;
  return localStorage.getItem('userId') || null;
};

/**
 * Generate a unique user ID if none exists
 * @returns {string}
 */
const ensureUserId = () => {
  if (isServer()) return null;
  
  let userId = getUserId();
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

/**
 * Handle API response and errors
 * @param {Response} response 
 * @returns {Promise<any>}
 */
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'API request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

/**
 * Get all weight entries for the current user
 * @param {Object} options
 * @param {string} options.startDate - Optional start date (YYYY-MM-DD)
 * @param {string} options.endDate - Optional end date (YYYY-MM-DD)
 * @param {number} options.limit - Maximum number of entries to return (default: 100)
 * @param {number} options.skip - Number of entries to skip (for pagination)
 * @returns {Promise<{entries: Array, pagination: Object}>}
 */
export async function getWeightEntries(options = {}) {
  // If using local storage, switch to that implementation
  if (useLocalStorageFallback()) {
    return getLocalWeightEntries(options);
  }
  
  const userId = ensureUserId();
  if (!userId) {
    throw new Error('No user ID available');
  }
  
  const queryParams = new URLSearchParams({ userId });
  
  // Add optional parameters
  if (options.startDate) queryParams.append('startDate', options.startDate);
  if (options.endDate) queryParams.append('endDate', options.endDate);
  if (options.limit) queryParams.append('limit', options.limit.toString());
  if (options.skip) queryParams.append('skip', options.skip.toString());
  
  const response = await fetch(`${API_BASE_URL}/weight/get-entries?${queryParams.toString()}`);
  return handleResponse(response);
}

/**
 * Add a new weight entry
 * @param {Object} entry 
 * @param {string} entry.date - Date in YYYY-MM-DD format
 * @param {number} entry.weight - Weight value
 * @param {string} [entry.notes] - Optional notes
 * @returns {Promise<Object>} The created entry
 */
export async function addWeightEntry(entry) {
  // If using local storage, switch to that implementation
  if (useLocalStorageFallback()) {
    return addLocalWeightEntry(entry);
  }
  
  const userId = ensureUserId();
  if (!userId) {
    throw new Error('No user ID available');
  }
  
  const response = await fetch(`${API_BASE_URL}/weight/create-entry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      ...entry
    })
  });
  
  return handleResponse(response);
}

/**
 * Update an existing weight entry
 * @param {string} entryId - ID of the entry to update
 * @param {Object} updates - Fields to update
 * @param {string} [updates.date] - New date (YYYY-MM-DD format)
 * @param {number} [updates.weight] - New weight value
 * @param {string} [updates.notes] - New notes
 * @returns {Promise<Object>} The updated entry
 */
export async function updateWeightEntry(entryId, updates) {
  // If using local storage, switch to that implementation
  if (useLocalStorageFallback()) {
    return updateLocalWeightEntry(entryId, updates);
  }
  
  const userId = ensureUserId();
  if (!userId) {
    throw new Error('No user ID available');
  }
  
  const response = await fetch(`${API_BASE_URL}/weight/update-entry/${entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      ...updates
    })
  });
  
  return handleResponse(response);
}

/**
 * Delete a weight entry
 * @param {string} entryId - ID of the entry to delete
 * @returns {Promise<Object>} Confirmation message
 */
export async function deleteWeightEntry(entryId) {
  // If using local storage, switch to that implementation
  if (useLocalStorageFallback()) {
    return deleteLocalWeightEntry(entryId);
  }
  
  const userId = ensureUserId();
  if (!userId) {
    throw new Error('No user ID available');
  }
  
  const response = await fetch(`${API_BASE_URL}/weight/delete-entry/${entryId}?userId=${userId}`, {
    method: 'DELETE'
  });
  
  return handleResponse(response);
}

/**
 * Delete multiple weight entries
 * @param {Object} options - Delete options
 * @param {string[]} [options.entryIds] - IDs of entries to delete
 * @param {boolean} [options.deleteAll] - Whether to delete all entries
 * @param {string} [options.startDate] - Start date for range deletion
 * @param {string} [options.endDate] - End date for range deletion
 * @returns {Promise<Object>} Confirmation message with count
 */
export async function bulkDeleteWeightEntries(options) {
  // If using local storage, switch to that implementation
  if (useLocalStorageFallback()) {
    return bulkDeleteLocalWeightEntries(options);
  }
  
  const userId = ensureUserId();
  if (!userId) {
    throw new Error('No user ID available');
  }
  
  const response = await fetch(`${API_BASE_URL}/weight/bulk-delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      ...options
    })
  });
  
  return handleResponse(response);
}

// ---------- Local Storage Fallback Implementation ---------- //

/**
 * Check if we should use localStorage instead of the API
 * @returns {boolean}
 */
function useLocalStorageFallback() {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_USE_LOCALSTORAGE_FALLBACK === 'true') {
    return true;
  }
  
  // Fallback to localStorage setting if environment variable is not set
  if (isServer()) return false;
  
  try {
    return localStorage.getItem('useLocalStorage') === 'true';
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return false;
  }
}

/**
 * Get all entries from localStorage
 * @returns {Array}
 */
function getLocalEntries() {
  if (isServer()) return [];
  
  try {
    const userId = ensureUserId();
    const entriesJson = localStorage.getItem(`weightEntries_${userId}`) || '[]';
    return JSON.parse(entriesJson);
  } catch (error) {
    console.error('Error getting entries from localStorage:', error);
    return [];
  }
}

/**
 * Save entries to localStorage
 * @param {Array} entries 
 */
function saveLocalEntries(entries) {
  if (isServer()) return;
  
  try {
    const userId = ensureUserId();
    localStorage.setItem(`weightEntries_${userId}`, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving entries to localStorage:', error);
  }
}

/**
 * Get weight entries from localStorage
 * @param {Object} options
 * @returns {Promise<{entries: Array, pagination: Object}>}
 */
async function getLocalWeightEntries(options = {}) {
  let entries = getLocalEntries();
  
  // Apply date filtering if provided
  if (options.startDate || options.endDate) {
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      if (options.startDate && new Date(options.startDate) > entryDate) {
        return false;
      }
      
      if (options.endDate && new Date(options.endDate) < entryDate) {
        return false;
      }
      
      return true;
    });
  }
  
  // Sort by date (newest first)
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Apply pagination
  const total = entries.length;
  const limit = options.limit ? parseInt(options.limit) : 100;
  const skip = options.skip ? parseInt(options.skip) : 0;
  
  entries = entries.slice(skip, skip + limit);
  
  return {
    entries,
    pagination: {
      total,
      limit,
      skip
    }
  };
}

/**
 * Add a weight entry to localStorage
 * @param {Object} entry 
 * @returns {Promise<Object>}
 */
async function addLocalWeightEntry(entry) {
  const entries = getLocalEntries();
  
  // Check for duplicate date
  const existingIndex = entries.findIndex(e => 
    new Date(e.date).toISOString().split('T')[0] === 
    new Date(entry.date).toISOString().split('T')[0]
  );
  
  if (existingIndex !== -1) {
    const error = new Error('Entry already exists for this date');
    error.status = 409;
    error.data = { existingEntry: entries[existingIndex] };
    throw error;
  }
  
  // Create new entry
  const newEntry = {
    _id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: ensureUserId(),
    date: new Date(entry.date).toISOString(),
    weight: parseFloat(entry.weight),
    notes: entry.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to local entries
  entries.push(newEntry);
  saveLocalEntries(entries);
  
  return newEntry;
}

/**
 * Update a weight entry in localStorage
 * @param {string} entryId 
 * @param {Object} updates 
 * @returns {Promise<Object>}
 */
async function updateLocalWeightEntry(entryId, updates) {
  const entries = getLocalEntries();
  const entryIndex = entries.findIndex(e => e._id === entryId);
  
  if (entryIndex === -1) {
    const error = new Error('Entry not found');
    error.status = 404;
    throw error;
  }
  
  // Check for duplicate date if changing date
  if (updates.date) {
    const duplicateIndex = entries.findIndex(e => 
      e._id !== entryId && 
      new Date(e.date).toISOString().split('T')[0] === 
      new Date(updates.date).toISOString().split('T')[0]
    );
    
    if (duplicateIndex !== -1) {
      const error = new Error('Another entry already exists for this date');
      error.status = 409;
      error.data = { existingEntry: entries[duplicateIndex] };
      throw error;
    }
  }
  
  // Update the entry
  const updatedEntry = {
    ...entries[entryIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // If date is updated, convert it to ISO string
  if (updates.date) {
    updatedEntry.date = new Date(updates.date).toISOString();
  }
  
  // If weight is updated, parse it as float
  if (updates.weight !== undefined) {
    updatedEntry.weight = parseFloat(updates.weight);
  }
  
  entries[entryIndex] = updatedEntry;
  saveLocalEntries(entries);
  
  return updatedEntry;
}

/**
 * Delete a weight entry from localStorage
 * @param {string} entryId 
 * @returns {Promise<Object>}
 */
async function deleteLocalWeightEntry(entryId) {
  const entries = getLocalEntries();
  const entryIndex = entries.findIndex(e => e._id === entryId);
  
  if (entryIndex === -1) {
    const error = new Error('Entry not found');
    error.status = 404;
    throw error;
  }
  
  // Remove the entry
  const deletedEntry = entries[entryIndex];
  entries.splice(entryIndex, 1);
  saveLocalEntries(entries);
  
  return {
    message: 'Entry deleted successfully',
    deletedEntry
  };
}

/**
 * Delete multiple weight entries from localStorage
 * @param {Object} options 
 * @returns {Promise<Object>}
 */
async function bulkDeleteLocalWeightEntries(options) {
  let entries = getLocalEntries();
  let originalCount = entries.length;
  
  if (options.deleteAll === true) {
    // Delete all entries
    entries = [];
  } else if (Array.isArray(options.entryIds) && options.entryIds.length > 0) {
    // Delete specific entries by ID
    entries = entries.filter(entry => !options.entryIds.includes(entry._id));
  } else if (options.startDate || options.endDate) {
    // Delete entries within a date range
    entries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      if (options.startDate && new Date(options.startDate) <= entryDate) {
        return false;
      }
      
      if (options.endDate && new Date(options.endDate) >= entryDate) {
        return false;
      }
      
      return true;
    });
  } else {
    const error = new Error('Invalid request. Provide entryIds, deleteAll=true, or date range');
    error.status = 400;
    throw error;
  }
  
  // Save updated entries
  saveLocalEntries(entries);
  
  return {
    message: 'Bulk deletion completed',
    deletedCount: originalCount - entries.length
  };
} 