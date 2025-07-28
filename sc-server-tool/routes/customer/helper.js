const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

router.get('/init', async function(req, res) {
  const customer = req.customer

  return res.json({ success: true, customer: {
    name: customer.name,
    avatar_url: customer.avatar_url,
    payment_code: customer.payment_code,
    is_partner: customer.is_partner
  } })
})

router.get('/news', async function(req, res) {
  let news = [
    {
      type: 'text',
      value: "Mọi phát sinh lỗi vui lòng liên hệ để được giải quyết."
    }
  ]
  return res.json({ success: true, news })
})

router.get('/dashboard', async function(req, res) {
  const OrderModel = getModel('Order')
  const KeyModel = getModel('Key')
  const ServiceModel = getModel('Service')
  const WalletModel = getModel('Wallet')

  let customer = req.customer
  let data = {
    total_wallet: 0,
    totalPaid: 0,
    info: {
      running: 0,
      waiting: 0,
      complete: 0,
      error: 0
    },
    apiKeyServices: [],
    seoServices: [],
  }
 
  let wallet = await WalletModel.findOne({ customer: customer._id }, 'balance')
  if (wallet) {
    data.total_wallet = wallet.balance
  }

  let orders = await OrderModel.find({ customer: customer.id }).limit(5).sort({ createdAt: -1 })
  for await (let order of orders) {
    data.totalPaid += Number(order.paid)

    if (order.status == 'wait_to_run') {
      data.info.waiting++
    } else if (order.status == 'running') {
      data.info.running++
    } else if (order.status == 'complete') {
      data.info.complete++
    } else if (order.status == 'cancelled') {
      data.info.error++
    }

    if (order.status == 'running') {
      let remainingData = ''
      if (order.package.type == 'api_key') {
        let keyData = await KeyModel.findOne({ key: order.order_result })
        if (keyData) {
          if (keyData.status) {
            remainingData = keyData.time - Date.now()
            remainingData = (remainingData / 86400000)

            if (remainingData <= 2) {
              remainingData = remainingData.toFixed(1)
            } else {
              remainingData = Math.floor(remainingData)
            }
          } else {
            remainingData = '0'
          }
        }

        order.package.remainingData = remainingData
        data.apiKeyServices.push(order)
      } else if (order.package.type == 'run_service') {
        try {
          if (order.package.is_custom && !order.package.is_custom_value) {
            let rs = await rootApiRequest.request({ 
              url: '/service/get-by-note/'+ 'order-' + order.id, 
              method: 'GET',
            })

            if (rs.data.success) {
              remainingData = rs.data.remainingData
              if (order.package.script_code == 'youtube_sub') {
                order.package.value = order.package.value * Object.keys(order.customer_values.channel_ids_data || {}).length
              }
              
            } else {
              remainingData = 0
            }
          } else {
            let rs = await rootApiRequest.request({ 
              url: '/service/'+order.order_result, 
              method: 'GET',
            })

            if (rs.data.success) {
              remainingData = rs.data.service.executed
              order.package.first_data_reported = rs.data.service.first_data_reported
              order.package.data_reported = rs.data.service.data_reported
            } else {
              remainingData = 0
            }
          }
        } catch (error) {
          remainingData = 0
        }

        order.package.remainingData = remainingData
        data.seoServices.push(order)
      }
    }
  }

  return res.json({ success: true, overviewData: data })
})

module.exports = router;
