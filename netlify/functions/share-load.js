const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get share ID from query params - support both id and shareId
    const shareId = event.queryStringParameters?.shareId || event.queryStringParameters?.id;
    
    if (!shareId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Share ID is required'
        })
      };
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('weight-tracker');
    
    // Find the share data
    const shareData = await db.collection('shares').findOne({ shareId });
    
    await client.close();

    if (!shareData) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'Share not found'
        })
      };
    }

    // Return the found data
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: shareData
      })
    };

  } catch (error) {
    console.error('Share load error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Failed to load shared data'
      })
    };
  }
};