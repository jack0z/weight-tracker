// share.js - Sharing functionality for weight tracker

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
export function generateShareLink(username, entries, startWeight, goalWeight, height, theme) {
  try {
    // Create the data to share
    const shareData = {
      sharedBy: username,
      entries,
      startWeight,
      goalWeight,
      height,
      theme,
      timestamp: Date.now()
    };

    // Store in localStorage with unique ID
    const shareId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));

    return {
      success: true,
      shareLink: `${window.location.origin}?view=${shareId}`
    };
  } catch (error) {
    console.error('Error generating share link:', error);
    return {
      success: false,
      message: 'Failed to generate share link'
    };
  }
}

/**
 * Load shared view data
 * @param {string} shareId - The share ID from the URL
 * @returns {Object} - Result with success status, message, and data if successful
 */
export function loadSharedView(shareId) {
  try {
    const data = localStorage.getItem(`share_${shareId}`);
    if (!data) {
      return {
        success: false,
        message: 'Shared data not found or expired'
      };
    }

    // Parse the stored data
    const shareData = JSON.parse(data);

    // Optional: Check if share has expired (e.g., after 24 hours)
    const now = Date.now();
    const shareTime = shareData.timestamp;
    const EXPIRE_AFTER = 24 * 60 * 60 * 1000; // 24 hours

    if (now - shareTime > EXPIRE_AFTER) {
      localStorage.removeItem(`share_${shareId}`);
      return {
        success: false,
        message: 'Share link has expired'
      };
    }

    return {
      success: true,
      data: shareData
    };
  } catch (error) {
    console.error('Error loading shared view:', error);
    return {
      success: false,
      message: 'Failed to load shared data'
    };
  }
}