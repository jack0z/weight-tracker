const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true
  },
  sharedBy: {
    type: String,
    required: true
  },
  entries: [{
    weight: Number,
    date: Date
  }],
  startWeight: Number,
  goalWeight: Number,
  height: Number,
  theme: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  }
});

module.exports = mongoose.models.Share || mongoose.model('Share', shareSchema);