const express = require('express');
var router = express.Router();

router.get('/update-vip', async function(req, res) {
  try {
    let id = req.query.id
    if (id) {
      const CustomerModel = getModel('Customer')
      let customer = await CustomerModel.findOne({ _id: id })
      if (customer) {
        await customer.updateOne({ is_partner: !customer.is_partner })
      }
    }

    res.send({ success: true })
  } catch (error) {
    console.log(error);
    res.send({ success: true })
  }
})

router.get('/recharge', async function(req, res) {
  try {
    const totalRecharge = req.query.total
    const customerId =  req.query.customerId
    if (totalRecharge && customerId) {
      const CustomerModel = getModel('Customer')
      const WalletModel = getModel('Wallet')

      let customer = await CustomerModel.findOne({ _id: customerId })
      if (customer) {
        let wallet = await WalletModel.findOne({ customer: customer._id })
        if (wallet) {
          await wallet.recharge(totalRecharge)
        }
        return res.send({ success: true })
      }
    }

    res.send({success: false})
  } catch (error) {
      console.log(error);
  }
})

router.get('/:id', async function(req, res) {
    try {
      let customerId = req.params.id
      if (customerId) {
        const CustomerModel = getModel('Customer')
        const WalletModel = getModel('Wallet')

        let customer = await CustomerModel.findOne({ _id: customerId })
        if (customer) {
          let wallet = await WalletModel.findOne({ customer: customer._id })
          if (!wallet) {
            wallet = { balance: 0 }
          }
          customer.set('wallet', wallet)
          customer = customer.toObject()
          return res.send({ success: true, customer })
        }
      }

      res.send({success: false})
    } catch (error) {
        console.log(error);
    }
})

module.exports = express.Router().use(router)
