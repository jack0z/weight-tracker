// Netlify function for handling weight tracker shared data

// In-memory storage for demo purposes
// In a production app, you would use a database like FaunaDB, MongoDB, etc.
const sharedData = {};

exports.handler = async function(event, context) {
  // Get the share ID from the URL or query parameters
  const id = event.path.split('/').pop() || event.queryStringParameters?.id || '';
  
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }
  
  if (event.httpMethod === 'POST') {
    // Store shared data
    try {
      const shareData = JSON.parse(event.body);
      const shareId = shareData.id;
      
      if (!shareId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Share ID is required' })
        };
      }
      
      // Add expiration timestamp (30 days)
      shareData.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Store the data
      sharedData[shareId] = shareData;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data stored successfully' })
      };
    } catch (error) {
      console.error('Error storing shared data:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: error.message })
      };
    }
  } else if (event.httpMethod === 'GET') {
    // Retrieve shared data
    try {
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Share ID is required' })
        };
      }
      
      const data = sharedData[id];
      
      if (!data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Shared data not found or expired' })
        };
      }
      
      // Check if data has expired
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        // Delete expired data
        delete sharedData[id];
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, message: 'Shared data has expired' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data })
      };
    } catch (error) {
      console.error('Error retrieving shared data:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: error.message })
      };
    }
  }
  
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ success: false, message: 'Method not allowed' })
  };
}; 