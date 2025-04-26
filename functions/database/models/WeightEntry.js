const mongoose = require('mongoose');

/**
 * Weight Entry Schema
 * Stores weight measurements with dates and optional notes
 */
const weightEntrySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  note: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Add compound index for userId and date to ensure one entry per day per user
weightEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

// Add a static method to find entries by date range
weightEntrySchema.statics.findByDateRange = function(userId, startDate, endDate, limit = 100) {
  const query = { userId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ date: -1 })
    .limit(limit);
};

// Add virtual property for formatted date (YYYY-MM-DD)
weightEntrySchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Set JSON transform to include virtual properties and format dates
weightEntrySchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Format the date as YYYY-MM-DD for easier client processing
    ret.date = ret.formattedDate;
    delete ret.formattedDate;
    return ret;
  }
});

// Register the model if it hasn't been registered yet
mongoose.models = mongoose.models || {};
mongoose.model('WeightEntry', weightEntrySchema);

// Export the schema for access in other files
module.exports = weightEntrySchema; 