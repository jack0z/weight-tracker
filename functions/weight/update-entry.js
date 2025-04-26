const { connectToDatabase, getModel } = require('../database/connection');

exports.handler = async (event, context) => {
  // Make the function use the same database connection on warm starts
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Only allow PUT method
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  try {
    // Get the entry ID from path parameters
    const id = event.path.split('/').pop();
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Entry ID is required' })
      };
    }
    
    // Parse request body
    const { userId, date, weight } = JSON.parse(event.body);
    
    // Validate required fields
    if (!userId || (!date && weight === undefined)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          message: 'At least one of date or weight must be provided'
        })
      };
    }
    
    // If weight is provided, validate it's a number
    if (weight !== undefined && isNaN(parseFloat(weight))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Weight must be a valid number' })
      };
    }
    
    // Connect to database
    await connectToDatabase();
    const WeightEntry = getModel('WeightEntry');
    
    // Build update object
    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    
    // Check if entry exists
    const existingEntry = await WeightEntry.findOne({ _id: id, userId });
    
    if (!existingEntry) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Entry not found' })
      };
    }
    
    // If changing the date, check if an entry with that date already exists
    if (date && existingEntry.date.toISOString().split('T')[0] !== new Date(date).toISOString().split('T')[0]) {
      const dateExists = await WeightEntry.findOne({ 
        userId, 
        date: new Date(date),
        _id: { $ne: id } // Exclude current entry
      });
      
      if (dateExists) {
        return {
          statusCode: 409,
          body: JSON.stringify({ 
            error: 'Another entry already exists for this date',
            existingEntry: dateExists
          })
        };
      }
    }
    
    // Update the entry
    const updatedEntry = await WeightEntry.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // Return the updated document
    );
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'PUT'
      },
      body: JSON.stringify(updatedEntry.toObject())
    };
  } catch (error) {
    console.error('Error updating weight entry:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update weight entry' })
    };
  }
}; 