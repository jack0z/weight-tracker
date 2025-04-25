// share.js - Sharing functionality for weight tracker

/**
 * Check if IndexedDB is supported by the browser
 * @returns {boolean} - Whether IndexedDB is supported
 */
function isIndexedDBSupported() {
  if (typeof window === 'undefined') return false;
  return window.indexedDB !== undefined && window.indexedDB !== null;
}

/**
 * Generate a unique ID for the share link
 * @param {string} username - The username of the current user
 * @param {boolean} usePermalink - Whether to generate a permalink
 * @returns {string} - A unique share ID
 */
function generateShareId(username, usePermalink = false) {
  return `${username}_${Date.now().toString(36)}_${usePermalink ? 'permalink' : ''}`;
}

/**
 * Create a package of data to be shared
 * @param {Array} entries - Weight entries to share
 * @param {string|number} startWeight - Starting weight
 * @param {string|number} goalWeight - Goal weight
 * @param {string|number} height - User height
 * @param {string} theme - Current theme
 * @param {string} username - Current username
 * @returns {Object} - The data package to share
 */
function createSharePackage(entries, startWeight, goalWeight, height, theme, username) {
  return {
    entries,
    startWeight,
    goalWeight,
    height,
    theme,
    sharedBy: username,
    sharedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 30 days
    isPermalink: false
  };
}

/**
 * Generate a shareable link
 * @param {string} username - Current username
 * @param {Array} entries - Weight entries to share
 * @param {string|number} startWeight - Starting weight
 * @param {string|number} goalWeight - Goal weight
 * @param {string|number} height - User height
 * @param {string} theme - Current theme
 * @param {boolean} usePermalink - Whether to generate a permalink
 * @returns {Object} - Result object with success status, message, and shareLink if successful
 */
async function generateShareLink(username, entries, startWeight, goalWeight, height, theme, usePermalink = false) {
  if (!username) {
    return { success: false, message: "You must be logged in to share your tracker" };
  }
  
  if (!entries || entries.length === 0) {
    return { success: false, message: "No weight data to share" };
  }
  
  try {
    const shareId = generateShareId(username, usePermalink);
    
    // Create the share data package
    const shareData = {
      entries: entries,
      startWeight: startWeight,
      goalWeight: goalWeight,
      height: height,
      theme: theme || 'light',
      sharedBy: username,
      sharedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 30 days
      isPermalink: usePermalink
    };
    
    // Save the data to localStorage (in a real app this would be stored in a database)
    localStorage.setItem(`shared_${shareId}`, JSON.stringify(shareData));
    
    // For static exports, we use the share-fallback page with query parameters
    const shareLink = `${window.location.origin}/share-fallback?id=${encodeURIComponent(shareId)}`;
    
    return {
      success: true,
      shareLink: shareLink,
      isPermalink: usePermalink,
      message: usePermalink ? 
        "Permalink created! This link will always show your latest data." : 
        "Share link created! This link will expire in 30 days."
    };
  } catch (error) {
    console.error("Error generating share link:", error);
    return {
      success: false,
      message: "Failed to generate share link: " + error.message
    };
  }
}

/**
 * Save shared data to IndexedDB for cross-device access
 * @param {string} shareId - The share ID
 * @param {Object} data - The data to store
 * @returns {Promise} - Promise that resolves when data is saved
 */
function saveToSharedCollection(shareId, data) {
  // If IndexedDB is not supported, just silently return
  if (!isIndexedDBSupported()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Create or open the IndexedDB database
    const request = indexedDB.open('weightTrackerShares', 1);
    
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create an object store if it doesn't exist
      if (!db.objectStoreNames.contains('shares')) {
        const store = db.createObjectStore('shares', { keyPath: 'id' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['shares'], 'readwrite');
      const store = transaction.objectStore('shares');
      
      // Add the data to the store
      const addRequest = store.put({ 
        id: shareId,
        data: data,
        expiresAt: new Date(data.expiresAt)
      });
      
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = (event) => reject(event.target.error);
    };
  }).catch(error => {
    console.error("Error saving to IndexedDB:", error);
    // Fall back to localStorage only if IndexedDB fails
  });
}

/**
 * Check if a shared view is valid
 * @param {string} shareId - The share ID from the URL
 * @returns {Object} - Result with success status, message, and data if successful
 */
async function loadSharedView(shareId) {
  if (!shareId) {
    return { success: false, message: "Invalid share link" };
  }
  
  try {
    // First try to get from localStorage for backward compatibility
    const sharedDataStr = localStorage.getItem(`shared_${shareId}`);
    
    // If found in localStorage, use that
    if (sharedDataStr) {
      const sharedData = JSON.parse(sharedDataStr);
      
      // Check if the data has expired
      if (sharedData.expiresAt && new Date(sharedData.expiresAt) < new Date()) {
        // Remove expired data
        localStorage.removeItem(`shared_${shareId}`);
        deleteFromSharedCollection(shareId);
        return { success: false, message: "This shared link has expired" };
      }
      
      return { success: true, message: "Shared data loaded successfully", data: sharedData };
    }
    
    // Otherwise try to get from IndexedDB
    try {
      const sharedData = await getFromSharedCollection(shareId);
      
      if (!sharedData) {
        return { success: false, message: "Shared data not found or expired" };
      }
      
      // Check if the data has expired
      if (sharedData.data.expiresAt && new Date(sharedData.data.expiresAt) < new Date()) {
        // Remove expired data
        deleteFromSharedCollection(shareId);
        return { success: false, message: "This shared link has expired" };
      }
      
      return { success: true, message: "Shared data loaded successfully", data: sharedData.data };
    } catch (error) {
      console.error("Error loading from IndexedDB:", error);
      return { success: false, message: "Shared data not found or expired" };
    }
  } catch (error) {
    console.error("Error loading shared view:", error);
    return { success: false, message: `Error loading shared data: ${error.message}` };
  }
}

/**
 * Get shared data from IndexedDB
 * @param {string} shareId - The share ID to retrieve
 * @returns {Promise} - Promise that resolves with the data
 */
function getFromSharedCollection(shareId) {
  // If IndexedDB is not supported, return null
  if (!isIndexedDBSupported()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('weightTrackerShares', 1);
    
    request.onerror = (event) => reject(event.target.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('shares')) {
        db.createObjectStore('shares', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      try {
        const transaction = db.transaction(['shares'], 'readonly');
        const store = transaction.objectStore('shares');
        const getRequest = store.get(shareId);
        
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    };
  });
}

/**
 * Delete a share link
 * @param {string} shareId - The share ID to delete
 * @returns {boolean} - Success status
 */
function deleteShareLink(shareId) {
  try {
    localStorage.removeItem(`shared_${shareId}`);
    deleteFromSharedCollection(shareId);
    return true;
  } catch (error) {
    console.error("Error deleting share link:", error);
    return false;
  }
}

/**
 * Delete shared data from IndexedDB
 * @param {string} shareId - The share ID to delete
 * @returns {Promise} - Promise that resolves when data is deleted
 */
function deleteFromSharedCollection(shareId) {
  // If IndexedDB is not supported, just silently return
  if (!isIndexedDBSupported()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('weightTrackerShares', 1);
    
    request.onerror = (event) => reject(event.target.error);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      try {
        const transaction = db.transaction(['shares'], 'readwrite');
        const store = transaction.objectStore('shares');
        const deleteRequest = store.delete(shareId);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    };
  }).catch(error => {
    console.error("Error deleting from IndexedDB:", error);
  });
}

// Clean up expired shares
function cleanupExpiredShares() {
  // Skip if not in browser environment
  if (typeof window === 'undefined') return;
  
  // Check localStorage for expired shares
  if (typeof localStorage !== 'undefined') {
    try {
      const now = new Date();
      
      // Get all keys from localStorage that start with 'shared_'
      const keys = Object.keys(localStorage).filter(key => key.startsWith('shared_'));
      
      // Check each one for expiration
      keys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt && new Date(data.expiresAt) < now) {
            localStorage.removeItem(key);
            console.log(`Removed expired localStorage share: ${key}`);
          }
        } catch (e) {
          // If we can't parse it, just ignore this entry
          console.warn(`Could not parse localStorage share data for key: ${key}`);
        }
      });
    } catch (e) {
      console.error("Error cleaning localStorage expired shares:", e);
    }
  }

  // If IndexedDB is not supported, skip that part of cleanup
  if (!isIndexedDBSupported()) {
    return;
  }

  // Clean up IndexedDB expired shares
  const request = indexedDB.open('weightTrackerShares', 1);
  
  request.onsuccess = (event) => {
    const db = event.target.result;
    
    try {
      // Check if the 'shares' object store exists before attempting transaction
      if (!db.objectStoreNames.contains('shares')) {
        console.log('Shares object store not found, skipping cleanup');
        return;
      }
      
      const transaction = db.transaction(['shares'], 'readwrite');
      const store = transaction.objectStore('shares');
      
      // Check if 'expiresAt' index exists
      if (!store.indexNames.contains('expiresAt')) {
        console.log('ExpiresAt index not found, skipping index-based cleanup');
        return;
      }
      
      const index = store.index('expiresAt');
      
      const range = IDBKeyRange.upperBound(new Date());
      const cursorRequest = index.openCursor(range);
      
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.value.id);
          console.log(`Removed expired IndexedDB share: ${cursor.value.id}`);
          cursor.continue();
        }
      };
    } catch (error) {
      console.error("Error cleaning up expired shares in IndexedDB:", error);
    }
  };
}

// Run cleanup on startup - only in browser
if (typeof window !== 'undefined') {
  setTimeout(cleanupExpiredShares, 1000);
  
  // Schedule cleanup to run periodically (every hour)
  setInterval(cleanupExpiredShares, 60 * 60 * 1000);
}

// Export functions
export {
  generateShareLink,
  loadSharedView,
  deleteShareLink
}; 