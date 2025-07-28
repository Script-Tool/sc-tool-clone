const mongoose = require('mongoose');

const Browsers= new mongoose.Schema({
  name: String,
  order: Number,
  isActive: { type: Boolean, default: true },
  isDownloadable: { type: Boolean, default: true }, // New field
  versions: [{
    version: String,
    downloadLink: String
  }]
});

module.exports = Browsers; 