const mongoose = require('mongoose')

let Schema = mongoose.Schema

let Proxy = new Schema({
  id: Number,
  used: { type: Boolean, default: false },
  server: String, 
  username: String, 
  password: String,
  partner_id: String,
}, { strict: false })

Proxy.set('timestamps', false)

Proxy.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('Proxy')
    this.id = newID
  }

  next()
})


Proxy.statics.reloadGlobalProxy = async function () {
  let _proxies = await getModel('Proxy').find({}, 'server username password -_id').lean()
  proxies = _proxies.map(item => {
    return item.server + '-' + item.username + '-' + item.password
  })
}

module.exports = Proxy
