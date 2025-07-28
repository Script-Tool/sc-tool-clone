const mongoose = require('mongoose')
let Schema = mongoose.Schema

let WalletSchema = new Schema({
  id: Number,
  balance: { type: Number, default: 0 },
  total_recharged: { type: Number, default: 0 },
  customer: { type: String, required: true },
})

WalletSchema.set('timestamps', true)

WalletSchema.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('Wallet')
    this.id = newID
  }

  next()
})

WalletSchema.methods.recharge = async function(totalRecharge) {
  await this.updateOne({
    $inc: {
      balance: totalRecharge,
      total_recharged: totalRecharge
    }
  })
}

module.exports = WalletSchema
