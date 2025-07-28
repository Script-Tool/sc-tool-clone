const mongoose = require('mongoose')

let Schema = mongoose.Schema

let modelSchema = new Schema({
  fb_id: { type: String, required: true },
  set_id: { type: String },
  set_code: { type: String },
}, { strict: false })

modelSchema.set('timestamps', false)

module.exports = modelSchema
