const mongoose = require('mongoose')

let Schema = mongoose.Schema

function generatorKey(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}

let KeySchema = new Schema({
  key: { type: String, unique: true, required: true },
  time: { type: Number },
  status: { type: Boolean, default: true },
  vm_used: [String]
}, { strict: false })

KeySchema.set('timestamps', true)

KeySchema.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('Key')
    this.id = newID
  }
  
  next()
})

KeySchema.statics.generateAPIKey = async function () {
  let newKey = ''
  let KeyModel = await getModel('Key')
  let existKey = {}
  do {
    newKey = generatorKey(25)
    existKey = await KeyModel.findOne({ key: newKey })
  } while (existKey);

  return newKey
}

module.exports = KeySchema
