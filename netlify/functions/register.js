const mongoose = require('mongoose');
const connectDB = require('../../database/db');

exports.handler = async function(event, context) {
  // Required for MongoDB connection in Netlify Functions
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    
    if (!username || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Username and password are required" })
      };
    }

    await connectDB();
    
    // Get User model after connection is established
    const User = require('../../database/schema/User');

    // Check for existing user
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Username already exists" })
      };
    }

    // Create new user
    const newUser = new User({ username, password });
    await newUser.save();

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: "Account created successfully",
        user: { username: newUser.username }
      })
    };

  } catch (error) {
    console.error("Registration error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: "Registration failed",
        error: error.message 
      })
    };
  }
};