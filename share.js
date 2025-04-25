// share.js - Sharing functionality for weight tracker

/**
 * Check if IndexedDB is supported by the browser
 * @returns {boolean} - Whether IndexedDB is supported
 */
function isIndexedDBSupported() {
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
 * Generate a shareable link
 * @param {string} username - Current username
 * @param {Array} entries - Weight entries to share
 * @param {string|number} startWeight - Starting weight
 * @param {string|number} goalWeight - Goal weight
 * @param {string|number} height - User height
 * @param {string} theme - Current theme
 * @returns {Object} - Result object with success status, message, and shareLink if successful
 */
async function generateShareLink(username, entries, startWeight, goalWeight, height, theme) {
  if (!username) {
    return { success: false, message: "You must be logged in to share your tracker" };
  }
  
  if (!entries || entries.length === 0) {
    return { success: false, message: "No weight data to share" };
  }
  
  try {
    // Generate a unique ID for sharing
    const shareId = generateShareId(username);
    
    // Create the data package to share
    const dataToShare = createSharePackage(entries, startWeight, goalWeight, height, theme, username);
    
    // Check if we're in a static export (Netlify) environment by checking if API is unavailable
    const isStaticExport = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
    
    // Only try to save to server if we're not in a static export
    if (!isStaticExport) {
      try {
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: shareId,
            ...dataToShare
          })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.error("Error saving shared data:", result.message);
          // Continue anyway and use localStorage as fallback
        }
      } catch (error) {
        console.warn("Error saving to server, falling back to localStorage:", error);
        // Continue anyway and use localStorage as fallback
      }
    }
    
    // Generate the full URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const shareLink = `${baseUrl}?view=${shareId}`;
    
    // Save to localStorage for all environments
    try {
      localStorage.setItem(`shared_${shareId}`, JSON.stringify(dataToShare));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
      return { success: false, message: "Failed to generate share link: Could not save data" };
    }
    
    return { 
      success: true, 
      message: "Share link generated successfully", 
      shareLink,
      shareId 
    };
  } catch (error) {
    console.error("Error generating share link:", error);
    return { success: false, message: `Failed to generate share link: ${error.message}` };
  }
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
    // Check if we're in a static export (Netlify) environment
    const isStaticExport = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
    
    // For static exports, skip the API call and go straight to localStorage
    if (!isStaticExport) {
      try {
        const response = await fetch(`/api/share?id=${shareId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log("Loaded shared data from server");
          return { success: true, message: "Shared data loaded successfully", data: result.data };
        }
        
        console.log("Server data not found or error:", result.message);
        // If server request fails, fall back to localStorage
      } catch (error) {
        console.error("Error loading from server:", error);
        // Fall back to localStorage
      }
    }
    
    // Try to load from localStorage
    console.log("Trying localStorage for shared data");
    const sharedDataStr = localStorage.getItem(`shared_${shareId}`);
    
    if (sharedDataStr) {
      const sharedData = JSON.parse(sharedDataStr);
      
      // Check if the data has expired
      if (sharedData.expiresAt && new Date(sharedData.expiresAt) < new Date()) {
        // Remove expired data
        localStorage.removeItem(`shared_${shareId}`);
        return { success: false, message: "This shared link has expired" };
      }
      
      return { success: true, message: "Shared data loaded successfully", data: sharedData };
    }
    
    return { success: false, message: "Shared data not found or expired" };
  } catch (error) {
    console.error("Error loading shared view:", error);
    return { success: false, message: `Error loading shared data: ${error.message}` };
  }
}

/**
 * Delete a share link
 * @param {string} shareId - The share ID to delete
 * @returns {boolean} - Success status
 */
async function deleteShareLink(shareId) {
  try {
    // Remove from localStorage
    localStorage.removeItem(`shared_${shareId}`);
    
    // Check if we're in a static export environment
    const isStaticExport = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
    
    // Only try to delete from server if we're not in a static export
    if (!isStaticExport) {
      try {
        await fetch(`/api/share?id=${shareId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.warn("Could not delete share from server", error);
        // Continue anyway as we've removed from localStorage
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting share link:", error);
    return false;
  }
}

// Clean up expired shares
function cleanupExpiredShares() {
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

  // If IndexedDB is not supported or we're in a static export, skip that part of cleanup
  if (!isIndexedDBSupported() || (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app'))) {
    return;
  }

  // Clean up IndexedDB expired shares
  try {
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
  } catch (error) {
    console.error("Error opening IndexedDB:", error);
  }
}

// Run cleanup on startup
setTimeout(cleanupExpiredShares, 1000);

// Schedule cleanup to run periodically (every hour)
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredShares, 60 * 60 * 1000);
}

// Export the functions
export {
  generateShareLink,
  loadSharedView,
  deleteShareLink,
  cleanupExpiredShares
}; 