// share.js - Sharing functionality for weight tracker

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
function generateShareLink(username, entries, startWeight, goalWeight, height, theme) {
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
    
    // Save to localStorage
    localStorage.setItem(`shared_${shareId}`, JSON.stringify(dataToShare));
    
    // Generate the full URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const shareLink = `${baseUrl}?view=${shareId}`;
    
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
function loadSharedView(shareId) {
  if (!shareId) {
    return { success: false, message: "Invalid share link" };
  }
  
  try {
    // Load shared data
    const sharedDataStr = localStorage.getItem(`shared_${shareId}`);
    
    if (!sharedDataStr) {
      return { success: false, message: "Shared data not found or expired" };
    }
    
    const sharedData = JSON.parse(sharedDataStr);
    
    // Check if the data has expired
    if (sharedData.expiresAt && new Date(sharedData.expiresAt) < new Date()) {
      // Remove expired data
      localStorage.removeItem(`shared_${shareId}`);
      return { success: false, message: "This shared link has expired" };
    }
    
    return { success: true, message: "Shared data loaded successfully", data: sharedData };
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
function deleteShareLink(shareId) {
  try {
    localStorage.removeItem(`shared_${shareId}`);
    return true;
  } catch (error) {
    console.error("Error deleting share link:", error);
    return false;
  }
}

// Export functions
export {
  generateShareLink,
  loadSharedView,
  deleteShareLink
}; 