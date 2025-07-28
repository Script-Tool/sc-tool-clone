const express = require('express');
var router = express.Router();

router.post('/', async function(req, res) {
  try {
    const OrderModel = getModel('Order')
    const WalletModel = getModel('Wallet')

    const customer = req.customer

    let data = req.body
    let order = await OrderModel.findOne({ _id: data.order_id, customer: customer.id })

    if (customer && order) {
      let wallet = await WalletModel.findOne({ customer: customer._id })
      if (wallet) {
        let paymentAmount = (customer.is_partner && order.package.vip_price) ? order.package.vip_price : order.package.price
        
        if (wallet.balance >= paymentAmount) {
          if (paymentAmount > 0) {
            const remainingBalance = wallet.balance - paymentAmount
            await wallet.updateOne({ balance: remainingBalance })
            order.paid = paymentAmount
            await order.save()
          }
          
          return res.json({ success: true, status: 'success', message: 'Thanh toán thành công.', order })
        } else {
          return res.json({ status: 'error', message: 'Số dư không đủ, vui lòng nạp thêm để thanh toán.' })
        }
      }
    }
   
    return res.json({ status: 'error', message: 'Error while handle payment' })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/', async function(req, res) {
  try {
    
    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/wallet-balance', async function(req, res) {
  try {
    const customer = req.customer
    if (customer) {
      const WalletModel = getModel('Wallet')
      let wallet = await WalletModel.findOne({ customer: customer._id })
      if (wallet) {
        return res.json({ success: true, wallet_balance: wallet.balance })
      }
    }
    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

module.exports = router;
