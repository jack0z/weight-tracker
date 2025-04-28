const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get share ID from query params
    const shareId = event.queryStringParameters?.id;
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
    const share = await db.collection('shares').findOne({ shareId });
    
    await client.close();

    if (!share) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'Share not found'
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          entries: share.entries,
          settings: {
            startWeight: share.startWeight,
            goalWeight: share.goalWeight,
            height: share.height,
            theme: share.theme
          },
          sharedBy: share.user
        }
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