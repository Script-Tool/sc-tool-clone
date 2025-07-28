const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../../modules/root-api-request')

router.get('/run-bh', async function (req, res, next) {
  const OrderModel = getModel('Order')
  let orders = await OrderModel.find({ status: 'complete' })
  let logData = {
    order: {
      total: 0,
      count: 0
    },
    customOrder: {
      total: 0,
      count: 0,
      totalItems: 0
    },
    adminOrder: {
      total: 0,
      count: 0,
      totalItems: 0
    }
  }

  let isRun = req.query.run
  async function runOrder (order) {
    if (!order.fisrt_value_log) return

    let currentValue
    try {
      currentValue = await OrderModel.getCurrentValue(order.package.script_code, order.customer_values)
    } catch (error) {
      console.log(error);
    }
    
    let totalTarget = Number(order.fisrt_value_log) + Number(order.package.value)
    if (currentValue && currentValue < totalTarget) {
      // call to server tool add more value
      let additional_value = totalTarget - currentValue
      additional_value += additional_value * 15 / 100
      additional_value = Math.floor(additional_value)
      
      logData.order.count++
      logData.order.total += additional_value
      
      if (isRun) {
        await rootApiRequest.request({
          url: '/service/additional',
          method: 'POST',
          data: {
            service_id: order.order_result,
            additional_value
          }
        })
        await order.updateOne({ status: 'running' })
      }
    }
  }

  async function runAdminOrder (order) {
    if (Array.isArray(order.customer_values.channel_ids_data)) {
      let adjust_list = []

      async function loadData(item) {
        let currentValue
        try {
            currentValue = await OrderModel.getCurrentValue(order.package.script_code, { channel_id: item.channel_id })
        } catch (error) {
            console.log(error);
        }
        
        let totalTarget = Number(item.fisrt_value_log) + Number(item.value)
        if (currentValue && currentValue < totalTarget) {
            let additional_value = totalTarget - currentValue
            additional_value += additional_value * 15 / 100
            additional_value = Math.floor(additional_value)

            logData.adminOrder.totalItems++
            logData.adminOrder.total += additional_value

            adjust_list.push({ additional_value, service_id: item.service_id })
        }
      }

      logData.adminOrder.count++
      await Promise.all(order.customer_values.channel_ids_data.map(item => loadData(item)))

      if (adjust_list.length && isRun) {
        rootApiRequest.request({
          url: '/service/additional',
          method: 'POST',
          data: {
            adjust_list
          }
        })

        await order.updateOne({ status: 'running' })
      }
    }
  }

  async function runCustomOrder (order) {
    if (!order.customer_values.channel_ids_data) return

    let adjust_list = []
    async function loadData (channelID, order) {
      let currentValue
      try {
        currentValue = await OrderModel.getCurrentValue(order.package.script_code, { channel_id: channelID })
      } catch (error) {
        console.log(error);
      }

      let totalTarget = Number(order.customer_values.channel_ids_data[channelID].fisrt_value_log) + Number(order.package.value)

      if (currentValue && currentValue < totalTarget) {
        let additional_value = totalTarget - currentValue
        additional_value += additional_value * 15 / 100
        additional_value = Math.floor(additional_value)

        logData.customOrder.total += additional_value
        logData.customOrder.totalItems++

        adjust_list.push({ additional_value, data_id: channelID, order_id: order.id })
      }
    }
    
    logData.customOrder.count++
    await Promise.all(Object.keys(order.customer_values.channel_ids_data).map(channel_id => {
      return loadData(channel_id, order)
    }))

    if (adjust_list.length && isRun) {
      rootApiRequest.request({
        url: '/service/additional',
        method: 'POST',
        data: {
          adjust_list
        }
      })

      await order.updateOne({ status: 'running' })
    }
  }

  await Promise.all(orders.map(order => {
    if (order.package.is_custom && !order.package.is_custom_value) {
      return runCustomOrder(order)

    } else if (order.customer == -1) {
      return runAdminOrder(order)

    } else {
      return runOrder(order)

    }
  }))

  return res.json({...logData, isRun })
})

router.get('/dashboard', async function(req, res) {
  try {
    let data = {
      total_customer: 0,
      total_current_wallet_balance: 0,
      total_wallet_charged: 0,
      total_order_running: 0,
      total_order_wait_to_run: 0,
      new_orders: [],
      top_customers: []
    }

    let filter = req.query.filter
    const WalletModel = getModel('Wallet')
    const CustomerModel = getModel('Wallet')
    const OrderModel = getModel('Order')

    data.total_customer = await CustomerModel.countDocuments()

    const wallets = await WalletModel.find({})
    wallets.forEach(wallet => {
      data.total_current_wallet_balance += Number(wallet.balance) || 0
      data.total_wallet_charged += Number(wallet.total_recharged) || 0
    })

    data.total_order_running = await OrderModel.countDocuments({ status: 'running' })
    data.total_order_wait_to_run = await OrderModel.countDocuments({ status: 'wait_to_run' })

    data.total_current_wallet_balance = data.total_current_wallet_balance.toLocaleString('it-IT', {style : 'currency', currency : 'VND'});
    data.total_wallet_charged = data.total_wallet_charged.toLocaleString('it-IT', {style : 'currency', currency : 'VND'});

    // new orders 
    // let orders = await OrderModel.find({ }).sort({ createdAt: -1 }).limit(5)
    // for await (let order of orders) {
    //   order.customer = await CustomerModel.findOne({ id: order.customer })
    // }
    // data.new_orders = orders

    // // top_customer
    // let topCustomers = []
    // let customers = await CustomerModel.find({})
    
    // for await (let customer of customers) {
    //  // console.log(customer.id);
    //   let countRunning = await OrderModel.find().countDocuments({  })
    //   console.log(countRunning);
    //   if (countRunning) {
    //     let wallet = await WalletModel.findOne({ customer: customer._id })
    //     customer.set('total_running', countRunning)
    //     if (wallet) {
    //       customer.set('total_recharged', wallet.total_recharged)
    //       customer.balance = wallet.balance
    //     }
        
    //     topCustomers.push(customer)
    //   }
    // }
    // data.top_customers = topCustomers

    res.render('customer-manage/index', { title: 'Dashboard', data });
  } catch (error) {
      console.log(error);
  }
})

router.get('/wallet', async function(req, res) {
    try {
      let WalletModel = getModel('Wallet')
      let wallets = await WalletModel.find({})

      console.log('asfasgg');
      res.render('customer-manage/wallet', { title: 'Wallet', wallets: [] });
    } catch (error) {
        console.log(error);
    }
})

router.get('/packages', async function(req, res) {
  try {
    let PackageModel = getModel('ServicePack')
    let packages = await PackageModel.find({}).sort({ createdAt: -1 })

    res.render('customer-manage/packages', { title: 'Packages', packages });
  } catch (error) {
      console.log(error);
  }
})

router.get('/customers', async function(req, res) {
  try {
    let CustomerModel = getModel('Customer')
    let WalletModel = getModel('Wallet')

    let filter = { }

    let current_page = req.query.current_page || 1
    let per_page = req.query.per_page || 50

    if (req.query.type) {
      if (req.query.type == 'vip') {
        filter.is_partner = true
      } else if (req.query.type == 'recharged') {
        filter.total_recharged = { $gt: 0 }
      }
    }

    if (req.query.customer_id) {
      filter['id'] = req.query.customer_id
    }

    if (req.query.payment_code) {
      filter['payment_code'] = req.query.payment_code
    }

    if (req.query.email) {
      filter.email = { $regex : req.query.email }
    }

    let customers = await CustomerModel.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
    let total = await CustomerModel.countDocuments(filter)
    for await (let customer of customers) {
      let wallet = await WalletModel.findOne({ customer: customer._id })
      if (!wallet) {
        wallet = { balance: 0, total_recharged: 0 }
      } else {
        wallet = wallet.toObject()
      }

      customer.wallet = wallet
    }

    res.render('customer-manage/customers', { title: 'Customers', customers, count: total, current_page, per_page });
  } catch (error) {
      console.log(error);
  }
})

router.get('/payment_jounal', async function(req, res) {
  try {
    let CustomerModel = getModel('Customer')
    let PaymentJounal = getModel('PaymentJounal')

    let limit = 50
    let jounals = await PaymentJounal.find().sort({ createdAt: -1 }).limit(limit)
    for await (let j of jounals) {
      let customer = await CustomerModel.findOne({ _id: j.customer })
      j.customer = customer.name
    }

    res.render('customer-manage/payment-jounal', { title: 'Payment Jounal', jounals });
  } catch (error) {
    console.log(error);
  }
})

router.get('/support', async function(req, res) {
  try {
    let CustomerModel = getModel('Customer')
    let WalletModel = getModel('Wallet')
    let customers = [
      {
        _id: '',
        name: 'Kim',
        avatar_url: 'https://card.thomasdaubenton.com/img/photo.jpg',
        last_message: 'last messsage',
        last_time: '3 phút'
      },
      {
        _id: '',
        name: 'trọng',
        avatar_url: 'https://card.thomasdaubenton.com/img/photo.jpg',
        last_message: 'last messsage',
        last_time: '3 phút'
      }
    ]
    res.render('customer-manage/support', { title: 'Support', customers });
  } catch (error) {
      console.log(error);
  }
})

router.get('/orders', async function(req, res, next) {
  try {
      let Order = getModel('Order')
      let info = {}//await oam_model.getProfileInfo()
      let filter = { customer: { $ne: -1 } }

      let current_page = req.query.current_page || 1
      let per_page = req.query.per_page || 50

      if (req.query.type) {
          filter.status = req.query.type
      }

      if (req.query.createdTime) {
          filter['createdAt'] = {
              $lt: new Date(Date.now() - 1000 * 60 * Number(req.query.createdTime))
          }
      }

      if (req.query.customer_id) {
        filter.customer = req.query.customer_id
      }
      
      if (req.query.id) {
        filter['id'] = req.query.id
      }

      let orders = await Order.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
      for await (let order of orders) {
        let customer = await getModel('Customer').findOne({ id: order.customer })
        if (customer) {
          order.customer_name = `${customer.id}-${customer.name}`
        }
      }
      let count = await Order.find(filter).countDocuments()

      res.render('customer-manage/orders', { title: 'orders', info: info, orders, count, current_page});
  } catch (error) {
      console.log('Error while get orders')
  }
});

router.get('/admin-orders', async function(req, res, next) {
  try {
      let Order = getModel('Order')
      let info = {}
      let filter = {
        customer: -1
      }

      let current_page = req.query.current_page || 1
      let per_page = req.query.per_page || 50

      if (req.query.type) {
          filter.status = req.query.type
      }

      if (req.query.createdTime) {
          filter['createdAt'] = {
            $lt: new Date(Date.now() - 1000 * 60 * Number(req.query.createdTime))
          }
      }

      let orders = await Order.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
      let count = await Order.find(filter).countDocuments()

      res.render('customer-manage/admin-orders', { title: 'admin-orders', info: info, orders, count, current_page});
  } catch (error) {
      console.log('Error while get orders')
  }
});

router.get('/keyword-tool', async function(req, res, next) {
  try {
      let Topic = getModel('Topic')
      let HotKeyword = getModel('HotKeyword')
      let filter = {}

      let current_page = req.query.current_page || 1
      let per_page = req.query.per_page || 50

      if (req.query.topic_code_filter) {
          filter.topic_code = req.query.topic_code_filter
      }

      let topics = await Topic.find({})
      for await (let topic of topics) {
        let totalKeywords = await HotKeyword.countDocuments({ topic_code: topic.code })
        topic.total_keywords = totalKeywords
      }
    
      let keywords = await HotKeyword.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
      let count = await HotKeyword.find(filter).countDocuments()

      res.render('customer-manage/keyword-tool', { title: 'Keyword Tool', topics, keywords, count, current_page});
  } catch (error) {
      console.log('Error while get keywords')
  }
});

module.exports = express.Router().use(router)
