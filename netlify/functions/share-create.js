const mongoose = require('mongoose');
const connectDB = require('./database/db');
const Share = require('./database/schema/Share');

exports.handler = async function(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const { username, entries, startWeight, goalWeight, height, theme } = JSON.parse(event.body);
    
    await connectDB();
    
    const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const share = new Share({
      shareId,
      sharedBy: username,
      entries,
      startWeight,
      goalWeight,
      height,
      theme
    });

    await share.save();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        shareLink: `${event.headers.host}?view=${shareId}`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to create share'
      })
    };
  }
};