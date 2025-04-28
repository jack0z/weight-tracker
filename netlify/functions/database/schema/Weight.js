const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  weight: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Weight || mongoose.model('Weight', weightSchema);