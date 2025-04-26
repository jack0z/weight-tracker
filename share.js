// share.js - Sharing functionality for weight tracker

/**
 * Check if we're in a browser environment
 * @returns {boolean} - Whether we're in a browser
 */
function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Check if IndexedDB is supported by the browser
 * @returns {boolean} - Whether IndexedDB is supported
 */
function isIndexedDBSupported() {
  if (!isBrowser()) return false;
  return window.indexedDB !== undefined && window.indexedDB !== null;
}

/**
 * Generate a unique ID for the share link
 * @param {string} username - The username of the current user
 * @returns {string} - A unique share ID
 */
function generateShareId(username) {
  return `${username}_${Date.now().toString(36)}`;
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
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expires in 30 days
  };
}

/**
 * Generate a shareable link using MongoDB database
 * @param {string} username - Current username
 * @param {Array} entries - Weight entries to share
 * @param {string|number} startWeight - Starting weight
 * @param {string|number} goalWeight - Goal weight
 * @param {string|number} height - User height
 * @param {string} theme - Current theme
 * @param {boolean} usePermalink - Whether this is a permalink (never expires)
 * @returns {Promise<Object>} - Result object with success status, message, and shareLink if successful
 */
async function generateShareLink(username, entries, startWeight, goalWeight, height, theme, usePermalink = false) {
  if (!username) {
    return { success: false, message: "You must be logged in to share your tracker" };
  }
  
  if (!entries || entries.length === 0) {
    return { success: false, message: "No weight data to share" };
  }
  
  try {
    // Call the Netlify function to save the share data in MongoDB
    const response = await fetch('/.netlify/functions/database/shares', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: username,
        entries: entries,
        startWeight: startWeight,
        goalWeight: goalWeight,
        height: height,
        theme: theme,
        sharedBy: username,
        isPermalink: usePermalink
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error("Error response from share API:", result);
      return {
        success: false,
        message: result.message || "Error generating share link"
      };
    }
    
    return {
      success: true,
      shareLink: result.shareLink,
      isPermalink: usePermalink
    };
  } catch (error) {
    console.error("Share error:", error);
    
    // Fallback to localStorage for offline mode or API failure
    try {
      const shareId = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.random().toString(36).substring(2, 10)}`;
      
      const shareData = {
        entries,
        startWeight,
        goalWeight,
        height,
        theme,
        sharedBy: username,
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isPermalink: usePermalink
      };
      
      // Save to localStorage as fallback
      localStorage.setItem(`shared_${shareId}`, JSON.stringify(shareData));
      
      const baseUrl = window.location.origin + window.location.pathname;
      const shareLink = `${baseUrl}?view=${shareId}`;
      
      return {
        success: true,
        shareLink,
        isPermalink: usePermalink,
        isLocal: true
      };
    } catch (fallbackError) {
      console.error("Fallback share error:", fallbackError);
      return {
        success: false,
        message: "Failed to generate share link."
      };
    }
  }
}

/**
 * Load a shared view from MongoDB or localStorage
 * @param {string} shareId - The share ID from the URL
 * @returns {Promise<Object>} - Result with success status, message, and data if successful
 */
async function loadSharedView(shareId) {
  if (!shareId) {
    return { success: false, message: "Invalid share link" };
  }
  
  try {
    // Try to fetch from MongoDB via Netlify function
    const response = await fetch(`/.netlify/functions/database/shares/${shareId}`);
    
    // If the server responded, use that response
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        // If server responded but share not found or expired
        return {
          success: false,
          message: result.message || "Share not found or expired"
        };
      }
    }
    
    // If network error or server down, fall back to localStorage
    // This is a fallback for offline usage or when the API is down
    console.warn("Could not reach the server, falling back to localStorage");
    
    const sharedDataStr = localStorage.getItem(`shared_${shareId}`);
    
    if (!sharedDataStr) {
      return { 
        success: false, 
        message: "Shared data not found or server unavailable" 
      };
    }
    
    const sharedData = JSON.parse(sharedDataStr);
    
    // Check if locally stored share has expired
    if (sharedData.expiresAt && new Date(sharedData.expiresAt) < new Date() && !sharedData.isPermalink) {
      localStorage.removeItem(`shared_${shareId}`);
      return { 
        success: false, 
        message: "This shared link has expired" 
      };
    }
    
    return { 
      success: true, 
      data: sharedData,
      isLocal: true
    };
  } catch (error) {
    console.error("Error loading shared view:", error);
    
    // Final fallback to localStorage
    try {
      const sharedDataStr = localStorage.getItem(`shared_${shareId}`);
      
      if (!sharedDataStr) {
        return { 
          success: false, 
          message: "Shared data not found" 
        };
      }
      
      const sharedData = JSON.parse(sharedDataStr);
      
      // Check if locally stored share has expired
      if (sharedData.expiresAt && new Date(sharedData.expiresAt) < new Date() && !sharedData.isPermalink) {
        localStorage.removeItem(`shared_${shareId}`);
        return { 
          success: false, 
          message: "This shared link has expired" 
        };
      }
      
      return { 
        success: true, 
        data: sharedData,
        isLocal: true
      };
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return { 
        success: false, 
        message: "Error loading shared data" 
      };
    }
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
      // Instead of rejecting, we'll resolve to allow graceful fallback
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create an object store if it doesn't exist
      if (!db.objectStoreNames.contains('shares')) {
        const store = db.createObjectStore('shares', { keyPath: 'id' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
        console.log("Created 'shares' object store");
      }
    };
    
    request.onsuccess = (event) => {
      try {
        const db = event.target.result;
        
        // Check if the object store exists before proceeding
        if (!db.objectStoreNames.contains('shares')) {
          // Handle the case where the store doesn't exist
          console.warn("The 'shares' object store doesn't exist. Will use localStorage only.");
          resolve();
          return;
        }
        
        const transaction = db.transaction(['shares'], 'readwrite');
        const store = transaction.objectStore('shares');
        
        // Add the data to the store
        const addRequest = store.put({ 
          id: shareId,
          data: data,
          expiresAt: new Date(data.expiresAt)
        });
        
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = (event) => {
          console.error("Error saving to IndexedDB:", event.target.error);
          resolve(); // Still resolve to allow graceful fallback
        };
      } catch (error) {
        console.error("Transaction error:", error);
        resolve(); // Resolve instead of reject to allow graceful fallback
      }
    };
  }).catch(error => {
    console.error("Error saving to IndexedDB:", error);
    // Fall back to localStorage only if IndexedDB fails
    return Promise.resolve();
  });
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
    
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      resolve(null); // Resolve with null instead of rejecting
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('shares')) {
        db.createObjectStore('shares', { keyPath: 'id' });
        console.log("Created 'shares' object store during get operation");
      }
    };
    
    request.onsuccess = (event) => {
      try {
        const db = event.target.result;
        
        // Check if the object store exists
        if (!db.objectStoreNames.contains('shares')) {
          console.warn("The 'shares' object store doesn't exist for reading");
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['shares'], 'readonly');
        const store = transaction.objectStore('shares');
        const getRequest = store.get(shareId);
        
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = (event) => {
          console.error("Error reading from IndexedDB:", event.target.error);
          resolve(null);
        };
      } catch (error) {
        console.error("Transaction error during read:", error);
        resolve(null);
      }
    };
  }).catch(error => {
    console.error("Error reading from IndexedDB:", error);
    return null;
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
 * Delete data from IndexedDB
 * @param {string} shareId - The share ID to delete
 * @returns {Promise} - Promise that resolves when data is deleted
 */
function deleteFromSharedCollection(shareId) {
  // If IndexedDB is not supported, just return
  if (!isIndexedDBSupported()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const request = indexedDB.open('weightTrackerShares', 1);
    
    request.onerror = () => {
      // Just resolve on error (fail silently)
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('shares')) {
        db.createObjectStore('shares', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      try {
        const db = event.target.result;
        
        // Check if object store exists
        if (!db.objectStoreNames.contains('shares')) {
          resolve();
          return;
        }
        
        const transaction = db.transaction(['shares'], 'readwrite');
        const store = transaction.objectStore('shares');
        
        const deleteRequest = store.delete(shareId);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => resolve(); // Just resolve on error
      } catch (error) {
        console.error("Error in delete transaction:", error);
        resolve();
      }
    };
  }).catch(() => {
    // Just resolve on any error (fail silently)
    return Promise.resolve();
  });
}

// Clean up expired shares
function cleanupExpiredShares() {
  // Skip cleanup entirely on server-side
  if (!isBrowser()) return;

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
      const transaction = db.transaction(['shares'], 'readwrite');
      const store = transaction.objectStore('shares');
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
if (isBrowser()) {
  setTimeout(cleanupExpiredShares, 1000);
  
  // Schedule cleanup to run periodically (every hour)
  setInterval(cleanupExpiredShares, 60 * 60 * 1000);
}

// Export all functions at the bottom
export {
  generateShareLink,
  loadSharedView,
  deleteShareLink
}; 