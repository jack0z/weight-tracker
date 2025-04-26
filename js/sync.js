/**
 * Sync Utility
 * Handles synchronization between local storage and MongoDB
 */

// Base API URL - could be environment-specific
const API_BASE_URL = '/.netlify/functions';

// LocalStorage keys
const ENTRIES_KEY = 'weightEntries';
const LAST_SYNC_KEY = 'lastSyncTimestamp';
const USER_ID_KEY = 'userId';

/**
 * Get current user ID or generate a demo ID if none exists
 * @returns {string} User ID
 */
function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  // Generate a demo user ID if none exists
  if (!userId) {
    userId = `demo-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

/**
 * Get all entries from local storage
 * @returns {Array} Weight entries
 */
function getLocalEntries() {
  try {
    const entriesJson = localStorage.getItem(ENTRIES_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error getting local entries:', error);
    return [];
  }
}

/**
 * Save entries to local storage
 * @param {Array} entries - Weight entries to save
 */
function saveLocalEntries(entries) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving local entries:', error);
  }
}

/**
 * Get the last sync timestamp
 * @returns {string|null} ISO timestamp or null if never synced
 */
function getLastSyncTimestamp() {
  return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Update the last sync timestamp
 * @param {string} timestamp - ISO timestamp
 */
function updateLastSyncTimestamp(timestamp) {
  localStorage.setItem(LAST_SYNC_KEY, timestamp || new Date().toISOString());
}

/**
 * Add or update an entry locally
 * @param {Object} entry - Weight entry to save
 */
function saveEntry(entry) {
  if (!entry || !entry.date || entry.weight === undefined) {
    console.error('Invalid entry data', entry);
    return false;
  }
  
  const entries = getLocalEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    // Update existing entry
    entries[existingIndex] = { ...entries[existingIndex], ...entry };
  } else {
    // Add new entry
    entries.push(entry);
  }
  
  // Sort entries by date (newest first)
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  saveLocalEntries(entries);
  return true;
}

/**
 * Delete an entry locally by date
 * @param {string} date - Date string in YYYY-MM-DD format
 */
function deleteEntry(date) {
  if (!date) return false;
  
  const entries = getLocalEntries();
  const newEntries = entries.filter(e => e.date !== date);
  
  if (entries.length !== newEntries.length) {
    saveLocalEntries(newEntries);
    return true;
  }
  
  return false;
}

/**
 * Synchronize local entries with the server
 * @returns {Promise<Object>} Sync result
 */
async function syncWithServer() {
  try {
    const userId = getUserId();
    const localEntries = getLocalEntries();
    const lastSync = getLastSyncTimestamp();
    
    // Prepare request data
    const requestData = {
      localEntries,
      lastSyncTimestamp: lastSync
    };
    
    // Call the sync API
    const response = await fetch(`${API_BASE_URL}/sync?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Sync failed');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Sync failed');
    }
    
    // Merge server entries with local entries
    mergeServerEntries(data.serverEntries);
    
    // Update last sync timestamp
    updateLastSyncTimestamp(data.timestamp);
    
    return {
      success: true,
      created: data.created,
      updated: data.updated,
      errors: data.errors
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Merge server entries with local entries
 * @param {Array} serverEntries - Entries from server
 */
function mergeServerEntries(serverEntries) {
  if (!Array.isArray(serverEntries) || serverEntries.length === 0) {
    return;
  }
  
  const localEntries = getLocalEntries();
  let hasChanges = false;
  
  // Process each server entry
  serverEntries.forEach(serverEntry => {
    // Format the date consistently
    const dateObj = new Date(serverEntry.date);
    const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create a normalized entry
    const normalizedEntry = {
      id: serverEntry._id,
      date: dateStr,
      weight: serverEntry.weight,
      note: serverEntry.note || ''
    };
    
    // Look for matching local entry
    const localIndex = localEntries.findIndex(e => e.date === dateStr);
    
    if (localIndex >= 0) {
      // Update existing entry if server version is different
      const localEntry = localEntries[localIndex];
      if (
        localEntry.weight !== serverEntry.weight ||
        localEntry.note !== serverEntry.note
      ) {
        localEntries[localIndex] = normalizedEntry;
        hasChanges = true;
      }
    } else {
      // Add new entry from server
      localEntries.push(normalizedEntry);
      hasChanges = true;
    }
  });
  
  // Save updated entries if changes were made
  if (hasChanges) {
    // Sort entries by date (newest first)
    localEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveLocalEntries(localEntries);
  }
}

// Export functions
export {
  getLocalEntries,
  saveEntry,
  deleteEntry,
  syncWithServer,
  getUserId
}; 