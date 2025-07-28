const mongoose = require('mongoose');
const { Schema } = mongoose;

const ContentDetail = new Schema({
  chapter: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  publishTime: {
    type: Date,
    required: true,
    default: () => {
      // Set default to next day at 9:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    },
  },
});

module.exports = ContentDetail;
