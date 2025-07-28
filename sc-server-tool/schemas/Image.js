const mongoose = require('mongoose')

let Schema = mongoose.Schema

let Image = new Schema({
  id: String,
  path: String,
  name: String,
  datetime: Date,
  type: String,
  width: String,
  height: String,
  size: String,
  deletehash: String,
  partner_id: String,
}, { strict: false })

Image.set('timestamps', false)

module.exports = Image
