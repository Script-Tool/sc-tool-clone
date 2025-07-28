const mongoose = require('mongoose')

let Schema = mongoose.Schema

let HotKeyword = new Schema({
  keyword: { type: String, required: true },
  region: { type: String },
  topic_code: String,
  dataLoaded: Object
}, { strict: false })

HotKeyword.set('timestamps', false)

HotKeyword.pre('save', async function (next) {

  next()
})

module.exports = HotKeyword
