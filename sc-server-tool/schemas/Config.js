const mongoose = require('mongoose')

let Schema = mongoose.Schema

let ConfigSchema = new Schema({
  data: { type: Object },
  key: String
}, { strict: false })

ConfigSchema.set('timestamps', true)

module.exports = ConfigSchema
