const mongoose = require('mongoose')

let Schema = mongoose.Schema
let Account = new Schema({
  username: String,
  password: String,
  verify: String,
  type: String,
  note: String,
  proxy_server: String,
}, { strict: false })

Account.set('timestamps', true)

Account.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('Account')
    this.id = newID
  }
  
  next()
})

module.exports = Account
