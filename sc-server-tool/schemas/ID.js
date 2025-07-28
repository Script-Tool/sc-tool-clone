const mongoose = require('mongoose')

let Schema = mongoose.Schema

let IDSchema = new Schema({
  name: { type: String, unique: true, required: true },
  counter: { type: Number, default: 1 },
}, { strict: false })

IDSchema.set('timestamps', false)

IDSchema.statics.next = async function (modelName) {
  return await this.findOneAndUpdate(
    { name: modelName },
    { $inc: { counter: 1 } },
    { upsert: true, fields: 'counter', new: true }
  ).then((doc) => {
    let newId = doc ? doc.counter : 1
    return newId
  }).catch((err) => {
    throw new Error('Error while generating new ID for "' + modelName + '": ' + err.message)
  })
}

module.exports = IDSchema
