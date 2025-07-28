const mongoose = require('mongoose')

let Schema = mongoose.Schema

let Customer = new Schema({
  id: Number,
  verify_data: { type: String, required: true },
  name: String,
  email: { type: String },
  password: { type: String },
  avatar_url: String,
  acl: [],
  jwt_token: String,
  is_active: { type: Boolean, default: true },
  login_type: String,
  is_new: { type: Boolean, default: false },
  payment_code: { type: String },
  is_partner: { type: Boolean, default: false },
  reg_ip: String,
  api_key: String,
  scripts_running: [{ type: Object }],
  config: { type: Object, default: {} },
  info: { type: Object },
}, { strict: false })

Customer.set('timestamps', true)

Customer.pre('save', async function (next) {
  if (!this.id) {
    let ID = await getModel('ID')
    let newID = await ID.next('Customer')
    this.id = newID

    this.api_key = new mongoose.Types.ObjectId()
  }  

  if (!this.payment_code && this.id) {
    this.payment_code = `VIES${this.id + 1000}PAY`
  }

  next()
})

Customer.methods.reLoadApiKey = async function () {
  const newApiKey = new mongoose.Types.ObjectId()
  await this.updateOne({ api_key: newApiKey })
  return newApiKey
}

module.exports = Customer
