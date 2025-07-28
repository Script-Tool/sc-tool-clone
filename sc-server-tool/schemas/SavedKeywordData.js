const mongoose = require('mongoose')

let Schema = mongoose.Schema

let SavedKeyword = new Schema({
  keyword: { type: String, required: true },
  keyword_code: { type: String },
  total_items: { type: Number, default: 0 },
  items: Array,
  customer: Number
}, { strict: false })

SavedKeyword.set('timestamps', false)

module.exports = SavedKeyword
