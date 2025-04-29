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
export async function generateShareLink(username, entries, startWeight, goalWeight, height, theme) {
  try {
    const response = await fetch('/.netlify/functions/share-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        entries,
        startWeight,
        goalWeight,
        height,
        theme
      })
    });

    const result = await response.json();
    return result;
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
export async function loadSharedView(shareId) {
  try {
    const response = await fetch(`/.netlify/functions/share-load?shareId=${shareId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to load shared data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading shared view:', error);
    return {
      success: false,
      message: error.message || 'Failed to load shared data'
    };
  }
}