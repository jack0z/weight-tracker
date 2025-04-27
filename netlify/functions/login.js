const mongoose = require('mongoose');
const connectDB = require('../../database/db');

exports.handler = async function(event, context) {
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
    const User = require('../../database/schema/User');

    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Invalid credentials" })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: "Login successful",
        user: { 
          username: user.username,
          id: user._id 
        }
      })
    };

  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: "Login failed",
        error: error.message 
      })
    };
  }
};