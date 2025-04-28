const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('weight-tracker');
    
    // Generate a unique share ID
    const shareId = Math.random().toString(36).substring(2, 15);
    
    // Store the share data
    await db.collection('shares').insertOne({
      shareId,
      createdAt: new Date(),
      ...data
    });
    
    // Close MongoDB connection
    await client.close();
    
    // Generate the share link
    const shareLink = `${process.env.URL || event.headers.host}/share/${shareId}`;
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        shareLink
      })
    };
    
  } catch (error) {
    console.error('Share creation error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Failed to create share link'
      })
    };
  }
};