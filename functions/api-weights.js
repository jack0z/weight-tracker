/**
 * API Handler for Weight Entries
 * Netlify Serverless Function
 */

const mongoose = require('mongoose');
const WeightEntry = require('./database/models/WeightEntry');
const jwt = require('jsonwebtoken');

// Connect to MongoDB (connection is reused across function invocations)
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Middleware to verify JWT token
const verifyToken = (authHeader) => {
  if (!authHeader) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Handler for GET requests - retrieve weight entries
const handleGet = async (userId, event) => {
  const queryParams = event.queryStringParameters || {};
  const { startDate, endDate } = queryParams;
  
  // Set up query conditions
  const query = { userId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  // Find entries matching the query
  const entries = await WeightEntry.find(query)
    .sort({ date: -1 })
    .limit(queryParams.limit ? parseInt(queryParams.limit) : 100);
  
  return entries;
};

// Handler for POST requests - create new weight entry
const handlePost = async (userId, event) => {
  const data = JSON.parse(event.body);
  
  // Validate required fields
  if (!data.date || data.weight === undefined) {
    throw new Error('Missing required fields: date and weight are required');
  }
  
  // Check if an entry already exists for this date
  const existingEntry = await WeightEntry.findOne({
    userId,
    date: new Date(data.date)
  });
  
  if (existingEntry) {
    throw new Error('An entry already exists for this date');
  }
  
  // Create the new entry
  const newEntry = new WeightEntry({
    userId,
    date: new Date(data.date),
    weight: Number(data.weight),
    note: data.note || ''
  });
  
  await newEntry.save();
  return newEntry;
};

// Handler for PUT requests - update an existing weight entry
const handlePut = async (userId, event) => {
  const pathSegments = event.path.split('/');
  const entryId = pathSegments[pathSegments.length - 1];
  
  if (!entryId) {
    throw new Error('Entry ID is required for updates');
  }
  
  const data = JSON.parse(event.body);
  const updateData = {};
  
  // Only include fields that are provided
  if (data.weight !== undefined) updateData.weight = Number(data.weight);
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.note !== undefined) updateData.note = data.note;
  
  // Find and update the entry
  const updatedEntry = await WeightEntry.findOneAndUpdate(
    { _id: entryId, userId },
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!updatedEntry) {
    throw new Error('Entry not found or you do not have permission to update it');
  }
  
  return updatedEntry;
};

// Handler for DELETE requests - delete a weight entry or all entries
const handleDelete = async (userId, event) => {
  const pathSegments = event.path.split('/');
  const entryId = pathSegments[pathSegments.length - 1];
  
  // If an ID is provided, delete specific entry
  if (entryId && entryId !== 'api' && entryId !== 'weights') {
    const deletedEntry = await WeightEntry.findOneAndDelete({
      _id: entryId,
      userId
    });
    
    if (!deletedEntry) {
      throw new Error('Entry not found or you do not have permission to delete it');
    }
    
    return { message: 'Entry deleted successfully', entryId };
  } 
  // Otherwise delete all entries for this user
  else {
    const result = await WeightEntry.deleteMany({ userId });
    return { 
      message: 'All entries deleted successfully',
      count: result.deletedCount
    };
  }
};

// Main handler function
exports.handler = async (event, context) => {
  // Make callback wait for function to complete
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    // Connect to database
    await connectToDatabase();
    
    // Check authentication
    let userId;
    try {
      // For development/testing, allow no auth with test user
      if (process.env.NODE_ENV === 'development' && !event.headers.authorization) {
        userId = 'test-user-id';
      } else {
        const decoded = verifyToken(event.headers.authorization);
        userId = decoded.userId;
      }
    } catch (error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: error.message })
      };
    }
    
    // Route based on HTTP method
    let result;
    switch (event.httpMethod) {
      case 'GET':
        result = await handleGet(userId, event);
        break;
      case 'POST':
        result = await handlePost(userId, event);
        break;
      case 'PUT':
        result = await handlePut(userId, event);
        break;
      case 'DELETE':
        result = await handleDelete(userId, event);
        break;
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.name === 'ValidationError' ? 400 : 500,
      body: JSON.stringify({ 
        message: error.message || 'An error occurred processing your request'
      })
    };
  }
}; 