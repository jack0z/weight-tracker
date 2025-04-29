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
      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          startWeight: user.startWeight,
          goalWeight: user.goalWeight,
          height: user.height,
          entries: user.entries,
          settings: user.settings
        })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { startWeight, goalWeight, height, entries, settings } = JSON.parse(event.body);
      
      const updateData = {};
      if (startWeight !== undefined) updateData.startWeight = startWeight;
      if (goalWeight !== undefined) updateData.goalWeight = goalWeight;
      if (height !== undefined) updateData.height = height;
      if (entries) updateData.entries = entries;
      if (settings) updateData.settings = settings;

      const user = await User.findOneAndUpdate(
        { username },
        { $set: updateData },
        { new: true }
      );

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Profile updated successfully',
          user: {
            startWeight: user.startWeight,
            goalWeight: user.goalWeight,
            height: user.height,
            entries: user.entries,
            settings: user.settings
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
      body: JSON.stringify({ message: 'Profile operation failed' })
    };
  }
};