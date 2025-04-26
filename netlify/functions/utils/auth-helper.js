const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

/**
 * Validates a JWT token from the authorization header
 * @param {Object} event - The Netlify function event object
 * @returns {Object} - Object containing validation result and user info
 */
function validateToken(event) {
  try {
    // Get the authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        valid: false, 
        message: 'Authorization header missing or invalid'
      };
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return { 
        valid: false, 
        message: 'Token missing'
      };
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return {
      valid: true,
      user: decoded
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valid: false,
        message: 'Token expired'
      };
    }
    
    return {
      valid: false,
      message: 'Invalid token',
      error: error.message
    };
  }
}

/**
 * Helper function to create an error response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} - Error response object
 */
function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ message })
  };
}

module.exports = {
  validateToken,
  createErrorResponse
}; 