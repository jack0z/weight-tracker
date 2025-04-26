/**
 * Authentication Utilities
 * JWT verification and user authentication helpers
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 * @param {Object} event - Netlify function event object
 * @returns {Object} - Decoded token payload or throws error
 */
const verifyToken = (event) => {
  try {
    // Get auth header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new Error('Token not found in authorization header');
    }
    
    // Verify with secret
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable not set');
    }
    
    // Return decoded payload
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error;
  }
};

/**
 * Middleware to authenticate requests
 * @param {Object} event - Netlify function event 
 * @returns {Object|null} - User object from token or null
 */
const authenticateUser = (event) => {
  try {
    const decodedToken = verifyToken(event);
    return {
      userId: decodedToken.sub || decodedToken.userId,
      email: decodedToken.email,
      // Add other user properties as needed
    };
  } catch (error) {
    return null;
  }
};

/**
 * Formats error response for API
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @returns {Object} - Formatted response object
 */
const formatErrorResponse = (statusCode, message) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({ error: message })
  };
};

module.exports = {
  verifyToken,
  authenticateUser,
  formatErrorResponse
}; 