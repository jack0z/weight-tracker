const mongoose = require('mongoose');
const connectDB = require('./database/db');
const User = require('./database/schema/User');

exports.handler = async function(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    await connectDB();
    const username = event.queryStringParameters?.username;

    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username is required' })
      };
    }

    if (event.httpMethod === 'GET') {
      const user = await User.findOne({ username });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          startWeight: user.startWeight,
          goalWeight: user.goalWeight,
          height: user.height
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { startWeight, goalWeight, height } = JSON.parse(event.body);
      const user = await User.findOneAndUpdate(
        { username },
        { startWeight, goalWeight, height },
        { new: true }
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Profile updated successfully',
          user: {
            startWeight: user.startWeight,
            goalWeight: user.goalWeight,
            height: user.height
          }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Profile error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Profile update failed' })
    };
  }
};