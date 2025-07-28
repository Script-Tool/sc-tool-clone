const mongoose = require('mongoose')
let Schema = mongoose.Schema

let ChatSchema = new Schema({
  customer: { type: String },
  message: { type: String },
}, { strict: false })

ChatSchema.set('timestamps', true)

module.exports = ChatSchema
