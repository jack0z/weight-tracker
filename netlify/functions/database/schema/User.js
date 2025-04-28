const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  startWeight: {
    type: Number
  },
  goalWeight: {
    type: Number
  },
  height: {
    type: Number
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);