const mongoose = require('mongoose')

let Schema = mongoose.Schema

let modelSchema = new Schema({
  link: { type: String, required: true },
  name: { type: String },
  set_id: { type: String },
  set_code: { type: String },
  status: { type: Boolean, default: true },
}, { strict: false })

modelSchema.set('timestamps', false)

modelSchema.pre('save', async function (next) {
  if (this.isNew) {
    let set = await getModel('FBGroupSet').findOne({ _id: this.set_id })
    if (set) {
      this.set_code = set.code
    }
  }

  next()
})

module.exports = modelSchema
