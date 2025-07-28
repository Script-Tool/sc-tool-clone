const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

router.post('/cancel', async function(req, res, next) {
  try {
      let data = req.body

      if (data.order_id) {
        const Order = getModel('Order')
        let order = await Order.findOne({ id: data.order_id })
        if (order) {
          let rs = await order.cancelAndRefund()
          return res.json(rs)
        }
      }
      
      return res.json({ success: false })
  } catch (error) {
    console.log('Error while get order collection')
    return res.json({ success: false })
  }
});

router.post('/collection', async function(req, res, next) {
  try {
      let Order = getModel('Order')
      let filter = {
        customer: req.customer.id
      }

      let current_page = req.body.current_page || 1
      let per_page = req.body.per_page || 50

      if (req.body.filter) {
        filter = { ...filter, ...req.body.filter }
      }
    
      let orders = await Order.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
      let count = await Order.find(filter).countDocuments()

      return res.json({ success: true, orders, count, current_page })
  } catch (error) {
      console.log('Error while get order collection')
  }
});

router.post('/custom', async function(req, res) {
  try {
    const OrderModel = getModel('Order')
    const Pack = getModel('ServicePack')
    const WalletModel = getModel('Wallet')
    let customer = req.customer
    const data = req.body

    let pack = await Pack.findOne({ id: data.pack })
    if (pack) {
      let paymentAmount = 0
      let customer_values = data.customer_values
      if (pack.is_custom_value) {
        if (customer_values.channel_id) {
          customer_values.channel_id = OrderModel.formatChannelId(customer_values.channel_id)
          let exist = await OrderModel.isExistChannel(customer_values.channel_id)
          if (exist) {
            return res.json(exist)
          }

          if (!customer_values.channel_id) {
            return res.json({ status: 'error', message: 'Sai định dạng channel ID' })
          }
        }

        paymentAmount = data.value * ((customer.is_partner && pack.vip_price) ? pack.vip_price : pack.price) // getPrice
        pack.price = paymentAmount
        pack.value = data.value
      }
      else if (pack.is_custom) {
        let items = (data.customer_values.channel_ids || data.customer_values.video_ids || data.customer_values.items)
        if (items) {
          items = items.split(',')
        } else {
          items = []
        }

        let validateItems = []
        for await (let item of items) {
          if (pack.script_code == 'youtube_sub') {
            item = OrderModel.formatChannelId(item)

            let exist = await OrderModel.isExistChannel(item)
            if (exist) {
              return res.json(exist)
            }

            if (!item.includes('channel/') && !item.includes('user/') && !item.includes('c/')) {
              return res.json({ status: 'error', message: 'Sai định dạng.' })
            }
          } else if (pack.script_code == 'watch_video') {
            item = OrderModel.formatVideoID(item)
            let exist = await OrderModel.isExistVideoID(item)
            if (exist) {
              return res.json(exist)
            }
          }
          
          validateItems.push(item)
        }

        let total_items = validateItems.length
        for (let lv of pack.price_levels) {
          if (total_items >= lv.total) {
            paymentAmount = lv.price
            break
          }
        }

        paymentAmount = paymentAmount * total_items

        if (pack.script_code == 'youtube_sub') {
          customer_values = {
            channel_ids: validateItems.join(',')
          }
        }

        let channel_ids_data = {}
        let video_ids_data = {}
        async function loadFisrtValue (itemData) {
          if (pack.script_code == 'youtube_sub') {
            let value = await OrderModel.getCurrentValue('youtube_sub', { channel_id: itemData })
            if (!channel_ids_data[itemData]) {
              channel_ids_data[itemData] = {}
            }
            channel_ids_data[itemData].fisrt_value_log = value
          } else if (pack.script_code == 'watch_video') {
            let rs = await OrderModel.getCurrentValue('watch_video', { playlist_url: itemData })
            let match = /P(?:(?<days>\d*)D)?T(?:(?<hours>\d*)H)?(?:(?<minutes>\d*)M)?(?:(?<seconds>\d*)S)/.exec(rs.items[0].contentDetails.duration);
            if (match && match.groups) {
              if (Number(match.groups['hours']) >= 1 || Number(match.groups['minutes']) > 50) {

              } else {
                throw Error('Thời lượng video phải trên 50p.')
              }
            } else {
              throw Error('Không lấy được thời lượng video.')
            }
            
            if (!video_ids_data[itemData]) {
              video_ids_data[itemData] = {}
            }

            video_ids_data[itemData].channel_title = rs.items[0].snippet.channelTitle
            video_ids_data[itemData].keyword = rs.items[0].snippet.title
            video_ids_data[itemData].fisrt_value_log = rs.items[0].statistics.viewCount
          }
        }

        await Promise.all(validateItems.map(itemData => {
          return loadFisrtValue(itemData)
        }))

        if (pack.script_code == 'youtube_sub') {
          customer_values.channel_ids_data = channel_ids_data
        } else if (pack.script_code == 'watch_video') {
          customer_values.video_ids_data = video_ids_data
        }
      }

      if (paymentAmount) {
        // check wallet
        let wallet = await WalletModel.findOne({customer: customer._id })
        if (wallet && wallet.balance >= paymentAmount) {
          pack.price = paymentAmount
          let orderData = {
            package: pack,
            paid: 0,
            customer: customer.id,
            customer_values
          }
          let order = await OrderModel.create(orderData)
          if (order) {
            const remainingBalance = wallet.balance - paymentAmount
            await wallet.updateOne({ balance: remainingBalance })
            order.paid = paymentAmount
            await order.save()

            return res.json({ success: true, status: 'success', message: 'Tạo đơn thành công.', order_id: order.id })
          }
        } else {
          return res.json({ status: 'error', message: 'Số dư ví không đủ.' })
        }
      }
    }

    return res.json({ success: false, status: 'error', message: 'Có lỗi xảy ra.' })
  } catch (error) {
    console.log(error);
    return res.json({ success: false, status: 'error', message: error.message })
  }
})

router.post('/', async function(req, res) {
  try {
    let packageId = req.body.package_id
    let customer = req.customer
  
    if (packageId && customer) {
      let ServicePackModel =  await getModel('ServicePack')
      let OrderModel =  await getModel('Order')
  
      let package = await ServicePackModel.findOne({ id: packageId, status: true })
      if (package) {
        // check payment
        let totalPayment = (customer.is_partner && package.vip_price) ? package.vip_price : package.price
        let wallet = await getModel('Wallet').findOne({ customer: customer._id })
        if (!wallet || wallet.balance < totalPayment) {
          return res.json({ status: 'error', message: 'Số dư ví không đủ.' })
        }
        package.price = totalPayment
        let orderData = {
          package: package,
          paid: 0,
          customer: customer.id,
        }
  
        let order = await OrderModel.create(orderData)

        if (package.is_gift && customer.is_new) {
          await customer.updateOne({ is_new: false })
        }
        return res.json({ success: true, order })
      }
    }
    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/report', async function(req, res) {
  let data = req.body
  let orderId = data.order_id
  let OrderModel = getModel('Order')

  if (orderId) {
    let queryParams = {
      filter: data.filter,
      limit: Number(data.limit),
      current_page: Number(data.current_page),
      select: 'executed remaining data note data_reported first_data_reported'
    }

    let serviceIds = []
    let order 
    if (orderId == -1) {
      let orders = await OrderModel.find({ customer: req.customer.id, 'package.type': 'run_service', status: 'running' }, 'order_result status')
      serviceIds = orders.map(order => order.order_result)
      delete queryParams.filter.note
      queryParams.filter = { ...queryParams.filter, _id: { $in: serviceIds } }
    } else {
      order = await OrderModel.findOne({ id: orderId, customer: req.customer.id })
    }
    
    if (order || serviceIds.length) {
      let rs = await rootApiRequest.request({ 
        url: '/service/collection',
        method: 'POST',
        data: queryParams
      })
  
      if (rs.data.success) {
        rs.data.services.forEach(sv => {
          if (order.package.script_code == 'youtube_sub') {
            sv.channel_id = JSON.parse(sv.data).channel_id
          } else if (order.package.script_code == 'watch_video') {
            sv.channel_id = JSON.parse(sv.data).playlist_url + ' - ' + JSON.parse(sv.data).keyword
          }
        });
        
        return res.json({ success: true, services: rs.data.services, total: rs.data.total })
      }
    }

    return res.json({ success: false })
  }
})

router.get('/', async function(req, res) {
  try {
    let customer = req.customer
  
    if (customer) {
      let OrderModel =  await getModel('Order')
      let orders = await OrderModel.find({ customer: customer.id, status: 'wait_to_run' })

      return res.json({ success: true, orders })
    }
    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/cancel', async function(req, res) {
  try {
    const OrderModel = getModel('Order')

    let customer = req.customer
    let order = await OrderModel.findOne({ _id: req.body.order_id, customer: customer.id })

    if (order) {
      await order.remove()
      return res.json({ success: true, status: 'success', message: 'Hủy thành công.' })
    }

    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})


module.exports = router;
