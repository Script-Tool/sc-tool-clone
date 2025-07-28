const mongoose = require('mongoose')
let Schema = mongoose.Schema

let PaymentJounalSchema = new Schema({
  type: { type: String },// recharge, admin_recharged
  amount: { type: Number },
  customer: { type: String },
  old_balance: Number,
  new_balance: Number,
  ref: String,
  transaction: String
}, { strict: false })

PaymentJounalSchema.set('timestamps', true)

PaymentJounalSchema.statics.createPaymentJounal = async function (data) {
  const { customer, old_wallet, totalReCharge, type, ref } = data
  const newWallet = await getModel('Wallet').findOne({ customer: customer._id })

  await this.create({
    type,
    amount: totalReCharge,
    customer: customer._id,
    old_balance: old_wallet.balance,
    new_balance: newWallet.balance,
    ref
  })
}

module.exports = PaymentJounalSchema
