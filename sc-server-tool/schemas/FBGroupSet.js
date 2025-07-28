const mongoose = require('mongoose')
const slugify = require('slugify')

let Schema = mongoose.Schema

let modelSchema = new Schema({
  name: { type: String },
  code: { type: String },
}, { strict: false })

modelSchema.set('timestamps', false)

modelSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.code) {
      let code = slugify(this.name)
      this.code = code
    }
  }

  next()
})

module.exports = modelSchema
