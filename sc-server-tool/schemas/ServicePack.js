const mongoose = require('mongoose')
let Schema = mongoose.Schema

let ServicePack = new Schema({
  id: Number,
  name: String,
  code: String,
  description: String,
  after_description: String,
  script_code: String,
  value: Number,
  unit: String,
  price: { type: Number, default: 0 },
  old_price: { type: Number, default: 0 },
  status: Boolean,
  type: { type: String }, // api_key, run_service,
  attributes: { type: Array, default: [] },
  is_gift: Boolean,
  is_custom: Boolean,
  is_custom_value: Boolean
}, { strict: false })

ServicePack.set('timestamps', true)

ServicePack.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('ServicePack')
    this.id = newID
  }

  next()
})

module.exports = ServicePack
