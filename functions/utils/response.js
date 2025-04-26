/**
 * Response utilities for Netlify functions
 * Provides consistent response formatting and CORS handling
 */

/**
 * Get standard CORS headers
 * @returns {Object} CORS headers
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

/**
 * Handle CORS preflight request
 * @returns {Object} Response for OPTIONS request
 */
function handleCorsPreflightRequest() {
  return {
    statusCode: 204,
    headers: getCorsHeaders(),
    body: '',
  };
}

/**
 * Format a successful response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted response
 */
function formatSuccessResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
    },
    body: JSON.stringify({
      success: true,
      ...data,
    }),
  };
}

/**
 * Format an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} additionalData - Additional data to include in response
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(message, statusCode = 400, additionalData = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
    },
    body: JSON.stringify({
      success: false,
      error: message,
      ...additionalData,
    }),
  };
}

module.exports = {
  getCorsHeaders,
  handleCorsPreflightRequest,
  formatSuccessResponse,
  formatErrorResponse,
}; 