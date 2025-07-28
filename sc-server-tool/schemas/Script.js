const mongoose = require('mongoose')

let Schema = mongoose.Schema

let Script = new Schema({
  id: Number,
  name: String,
  code: { type: String, unique: true },
  position: Number,
  status: { type: Boolean, default: true },
  example_data: String,
  is_break: { type: Boolean, default: false },
  default_service_data: { type: Object },
  logs: { type: Object },
  logsSubMissing: { type: Object },
  data_inputs: [{ type: Object }], // { code: '', name: '' type: ''}
  script_type: Array,
}, { strict: false })

Script.set('timestamps', true)

Script.pre('save', async function (next) {
  if (this.isNew) {
    let pModel = await getModel('Script')
    let count = await pModel.find().countDocuments()
    this.position = count

    let ID = await getModel('ID')
    let newID = await ID.next('Script')
    this.id = newID
    this.default_service_data = {
      data: this.example_data,
      start_max_time: 0,
      end_max_time: 0,
    }
  }

  next()
})

Script.statics.initPosition = async function () {
  let pModel = await getModel('Script')
  let scripts = await pModel.find().sort({position: 1})
  let position = 0
  for await (let script of scripts) {
    await script.updateOne({ position: position })
    position++
  }
}

Script.post('deleteOne', async function () {
  let pModel = await getModel('Script')
  await pModel.initPosition()
})

module.exports = Script
