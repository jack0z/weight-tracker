const mongoose = require('mongoose');
const connectDB = require('./database/db');
const User = require('./database/schema/User');

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    console.log('Registration attempt for:', username);

    await connectDB();
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }

    const newUser = new User({ username, password });
    await newUser.save();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: 'Account created successfully' })
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Registration failed' })
    };
  }
};