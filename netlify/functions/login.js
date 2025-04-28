const mongoose = require('mongoose');
const connectDB = require('./database/db');
const User = require('./database/schema/User');

exports.handler = async function(event, context) {
  // Prevent function from waiting for connections to close
  context.callbackWaitsForEmptyEventLoop = false;

  // CORS headers for different environments
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://your-production-domain.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS (preflight) requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Check for required environment variables
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Server configuration error' })
      };
    }

    // Parse and validate request body
    const { username, password } = JSON.parse(event.body);
    
    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Username and password are required' })
      };
    }

    console.log('Login attempt for:', username);

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Database connection failed' })
      };
    }

    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Find user and validate password
    const user = await User.findOne({ username });
    console.log('User found:', !!user);

    if (!user || user.password !== password) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        user: {
          username: user.username,
          id: user._id
        }
      })
    };

  } catch (error) {
    // Log the full error for debugging
    console.error('Login error:', error);

    // Return a safe error message to the client
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    };
  }
};