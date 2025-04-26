const mongoose = require('mongoose');
const { dbConnect } = require('./database/db-connect');
const WeightEntry = require('./database/models/WeightEntry');

// Helper to parse the request body
const parseBody = (body) => {
  try {
    return typeof body === 'string' ? JSON.parse(body) : body;
  } catch (error) {
    return null;
  }
};

// Response helper
const response = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify(body)
  };
};

exports.handler = async (event, context) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  const userId = event.queryStringParameters?.userId;
  
  // Check if userId is provided
  if (!userId) {
    return response(400, { error: 'User ID is required' });
  }

  try {
    // Connect to the database
    await dbConnect();
    
    // GET - Retrieve weight entries
    if (event.httpMethod === 'GET') {
      const from = event.queryStringParameters?.from;
      const to = event.queryStringParameters?.to;
      const limit = event.queryStringParameters?.limit || 100;
      
      let query = { userId };
      
      // If date range is provided
      if (from && to) {
        query.date = {
          $gte: new Date(from),
          $lte: new Date(to)
        };
      }
      
      const entries = await WeightEntry.find(query)
        .sort({ date: -1 }) // Sort by date descending
        .limit(parseInt(limit, 10));
        
      return response(200, { entries });
    }
    
    // POST - Create a new weight entry
    if (event.httpMethod === 'POST') {
      const data = parseBody(event.body);
      
      if (!data) {
        return response(400, { error: 'Invalid request body' });
      }
      
      if (!data.date || !data.weight) {
        return response(400, { error: 'Date and weight are required' });
      }
      
      // Check if an entry already exists for this date
      const existingEntry = await WeightEntry.findOne({
        userId,
        date: new Date(data.date)
      });
      
      if (existingEntry) {
        return response(409, { 
          error: 'An entry already exists for this date',
          entryId: existingEntry._id
        });
      }
      
      const newEntry = new WeightEntry({
        userId,
        date: new Date(data.date),
        weight: data.weight,
        note: data.note || ''
      });
      
      const savedEntry = await newEntry.save();
      
      return response(201, { entry: savedEntry });
    }
    
    // PUT - Update a weight entry
    if (event.httpMethod === 'PUT') {
      const entryId = event.queryStringParameters?.id;
      
      if (!entryId) {
        return response(400, { error: 'Entry ID is required' });
      }
      
      const data = parseBody(event.body);
      
      if (!data) {
        return response(400, { error: 'Invalid request body' });
      }
      
      // Find the entry to update
      const entry = await WeightEntry.findOne({
        _id: entryId,
        userId // Ensure the entry belongs to the user
      });
      
      if (!entry) {
        return response(404, { error: 'Entry not found' });
      }
      
      // Update only the fields that are provided
      if (data.date) entry.date = new Date(data.date);
      if (data.weight !== undefined) entry.weight = data.weight;
      if (data.note !== undefined) entry.note = data.note;
      
      const updatedEntry = await entry.save();
      
      return response(200, { entry: updatedEntry });
    }
    
    // DELETE - Remove a weight entry
    if (event.httpMethod === 'DELETE') {
      const entryId = event.queryStringParameters?.id;
      
      if (!entryId) {
        return response(400, { error: 'Entry ID is required' });
      }
      
      const deletedEntry = await WeightEntry.findOneAndDelete({
        _id: entryId,
        userId // Ensure the entry belongs to the user
      });
      
      if (!deletedEntry) {
        return response(404, { error: 'Entry not found' });
      }
      
      return response(200, { message: 'Entry deleted successfully' });
    }
    
    return response(405, { error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Server error:', error);
    return response(500, { error: 'Internal server error', message: error.message });
  }
}; 