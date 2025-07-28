const mongoose = require('mongoose')

let Schema = mongoose.Schema

let User = new Schema({
  id: Number,
  username: { type: String, required: true },
  password: { type: String, required: true },
  acl: [],
  tokens: [String],
  role: String,
}, { strict: false })

User.set('timestamps', true)

User.pre('save', async function (next) {

  next()
})

module.exports = User
