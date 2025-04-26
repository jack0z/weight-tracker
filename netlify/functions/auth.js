const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
let cachedClient = null;

exports.handler = async function(event, context) {
  // Set context.callbackWaitsForEmptyEventLoop to false to keep the connection open
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { action, username, password } = JSON.parse(event.body);
    
    if (!action || !username || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Action, username, and password are required' })
      };
    }

    // Connect to MongoDB
    if (!cachedClient) {
      const client = new MongoClient(uri);
      await client.connect();
      cachedClient = client;
      console.log('Connected to MongoDB');
    }

    // Access the database
    const db = cachedClient.db('weight_tracker');
    const collection = db.collection('users');

    // Handle login or register
    if (action === 'register') {
      // Check if username already exists
      const existingUser = await collection.findOne({ username });
      
      if (existingUser) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Username already exists' })
        };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user
      await collection.insertOne({
        username,
        password: hashedPassword,
        createdAt: new Date()
      });

      // Generate JWT token
      const token = jwt.sign(
        { username },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: 'User registered successfully',
          token,
          username
        })
      };
    } else if (action === 'login') {
      // Find the user
      const user = await collection.findOne({ username });
      
      if (!user) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Invalid username or password' })
        };
      }

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Invalid username or password' })
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { username },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: 'Login successful',
          token,
          username
        })
      };
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Invalid action' })
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Error processing authentication',
        error: error.message
      })
    };
  }
}; 