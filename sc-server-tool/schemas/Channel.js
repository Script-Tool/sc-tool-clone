const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  channelId: { 
    type: String, 
    unique: true,
    required: true
  },
  lastChecked: { 
    type: Date, 
    default: new Date(0) 
  },
  tags: {
    type: String,
    default: ""
  },
  pllDescription: {
    type: String,
    default: ""
  },
  suggestChannel: {
    type: String,
    default: ""
  },
});

module.exports = ChannelSchema;