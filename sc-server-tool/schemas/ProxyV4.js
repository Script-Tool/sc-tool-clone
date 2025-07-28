const mongoose = require('mongoose')

let Schema = mongoose.Schema

let ProxyV4 = new Schema({
  id: Number,
  api_key: String,
  total_used: { type: Number, default: 0 },
  server: { type: String },
  status: { type: Boolean, default: true },
}, { strict: false })

ProxyV4.set('timestamps', true)

ProxyV4.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('ProxyV4')
    this.id = newID
  }

  next()
})

module.exports = ProxyV4
