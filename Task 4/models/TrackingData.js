const mongoose = require('mongoose');

const trackingDataSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  isProductive: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('TrackingData', trackingDataSchema); 