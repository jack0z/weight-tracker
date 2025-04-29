const mongoose = require('mongoose');
const connectDB = require('./database/db');
const User = require('./database/schema/User');
const Weight = require('./database/schema/Weight');

exports.handler = async function(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Get weight history
    if (event.httpMethod === 'GET') {
      const weights = await Weight.find({ username })
        .sort({ date: -1 })
        .limit(30);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ weights })
      };
    }

    // Add new weight entry
    if (event.httpMethod === 'POST') {
      const { weight } = JSON.parse(event.body);
      const newWeight = new Weight({
        username,
        weight,
        date: new Date()
      });
      await newWeight.save();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Weight entry added successfully',
          entry: newWeight
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Weight tracking error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Weight tracking failed' })
    };
  }
};