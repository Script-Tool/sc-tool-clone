const express = require('express');
var router = express.Router();
const multer = require('multer')
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv');
const fs = require('fs')
const rootApiRequest = require('../../../modules/root-api-request')

router.get('/delete/:order_id', async function (req, res) {
  let order_id = req.params.order_id
  if (order_id) {
    const OrderModel = getModel('Order')
    let order = await OrderModel.findOne({ id: order_id })

    if (order) {
      if (order.customer == -1) {
        if (order.customer_values.channel_ids_data) {
          order.customer_values.channel_ids_data.map(item => {
            rootApiRequest.request({
              url: '/service/delete',
              method: 'POST',
              data: {
                service_id: item.service_id
              }
            })
          })
        }
      } else if (order.order_result) {
        await rootApiRequest.request({
          url: '/service/delete',
          method: 'POST',
          data: {
            service_id: order.order_result
          }
        })
      }
      await order.remove()

      res.json({ success: true })
    }
  }
})

router.get('/cancel/:order_id', async function (req, res) {
  let order_id = req.params.order_id

  if (order_id) {
    const Order = getModel('Order')
    let order = await Order.findOne({ id: order_id })
    if (order) {
      let rs = await order.cancelAndRefund()
      return res.json(rs)
    }
  }

  res.json({ success: false })
})

router.get('/admin/set-status/:order_id', async function (req, res) {
  let order_id = req.params.order_id

  if (order_id && req.query.status) {
    const Order = getModel('Order')
    let order = await Order.findOne({ id: order_id })
    if (order) {
      let ids = []
      if (Array.isArray(order.customer_values.channel_ids_data)) {
        ids = order.customer_values.channel_ids_data.map(item => item.service_id)
      } else {
        ids = [Number(order.order_result)]
      }

      if (Array.isArray(ids) && ids.length > 0) {
        let rs = await rootApiRequest.request({
          url: '/service/set-service-status',
          method: 'POST',
          data: {
            ids: ids,
            status: req.query.status
          }
        })

        if (rs.data && rs.data.success && Boolean(Number(req.query.status))) {
          await order.updateOne({ status: 'running' })
        } else {
          await order.updateOne({ status: 'stopped' })
        }
      }
    }
  }
  res.json({ success: true })
})

router.get('/admin/additional-sub/confirm/:order_id', async function (req, res) {
  let confirmData = req.query.confirmData

  if (confirmData) {
    Object.keys(channelData).map(channelID => {
      return rootApiRequest.request({
        url: '/service/additional',
        method: 'POST',
        data: {
          service_id: confirmData[channelID].service_id,
          additional_value: confirmData[channelID].additional_value
        }
      })
    })
  }
  res.json({ success: true })
})

router.get('/admin/additional-sub/:order_id', async function (req, res) {
  let orderID = req.params.order_id
  if (orderID) {
    let OrderModel = getModel("Order")
    let order = await OrderModel.findOne({ id: orderID })
    if (order) {
      let channelData = order.customer_values.channel_ids_data
      let confirmData = null
      let totalAdditional_value = 0

      async function handleAdd (channelId) {
        let serviceData = await rootApiRequest.request({ 
          url: '/service/'+channelData[channelId].service_id, 
          method: 'GET',
        })
  
        if (serviceData.data.success && serviceData.data.service.remaining == 0) {
          try {
            let currentValue = await OrderModel.getCurrentValue('youtube_sub', { channel_id: channelId })
            currentValue = Number(currentValue)
            let targetValue = Number(channelData[channelId].fisrt_value_log) + Number(channelData[channelId].value)
            if (currentValue < targetValue) {
              let additional_value = targetValue - currentValue
              additional_value += additional_value * 15 / 100
              additional_value = Math.floor(additional_value)
              if (additional_value) {
                if (!confirmData) {
                  confirmData = {}
                }
                totalAdditional_value += additional_value
                confirmData[channelId] = {
                  service_id: channelData[channelId].service_id,
                  additional_value,
                  channel_id: channelId,
                  info: `${channelData[channelId].fisrt_value_log} + ${channelData[channelId].value}=${targetValue}`,
                  current_value: currentValue
                }
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      }

      await Promise.all(
        Object.keys(channelData).map(channelId => (handleAdd(channelId)))
      ).then(rs => {
        if (confirmData) {
          return res.json({success: true, confirmData, totalAdditional_value})
        }
      })

      return res.json({ success: true, order })
    }
  }
  res.json({ success: false })
})

router.get('/admin/:id', async function (req, res) {
  let id = req.params.id
  if (id) {
    let OrderModel = getModel("Order")
    let order = await OrderModel.findOne({ id: id })
    if (order) {
      // let channelData = order.customer_values.channel_ids_data
      // for await (let channelId of Object.keys(channelData)) {
      //   try {
      //     let serviceData = await rootApiRequest.request({ 
      //       url: '/service/'+channelData[channelId].service_id, 
      //       method: 'GET',
      //     })
    
      //     if (serviceData.data.success) {
      //       channelData[channelId].current_value = serviceData.data.service.data_reported
      //     }
      //   } catch (error) {
      //     console.log(error);
      //   }
      // }
      return res.json({ success: true, order })
    }
  }
  res.json({ success: false })
})

router.post('/import-sub-orders', upload.single('importFile'), function (req, res) {
  try {
    const fileRows = [];
    let Order = getModel('Order')
    csv.parseFile(req.file.path)
      .on("data", function (data) {
        fileRows.push(data)
      })
      .on("end", async function () {
        try {
          fileRows.shift()
          fs.unlinkSync(req.file.path);   // remove temp file
          let errorChannels = []

          let orderData = {
            customer: -1,
            script_code: 'youtube_sub',
            package: {},
            status: 'running',
            paid_in_full: true,
            customer_values: {},
            order_result: '',
            fisrt_value_log: '',
            group_name: fileRows[0][5]
          }

          let order
          let channelIDsData = []
          let totalValue = 0
          if (req.query.order_addition) {
            order = await Order.findOne({ id: req.query.order_addition })
            totalValue = order.customer_values.total_value
            channelIDsData = order.customer_values.channel_ids_data
          } else {
            order = await Order.create(orderData)
          }

          async function createOrder(row) {
            try {
              let channelID = Order.formatChannelId(row[0])
              let fisrt_value_log = await Order.getCurrentValue('youtube_sub', { channel_id: channelID })
              let value = Number(row[4])

              order.package = {
                script_code: 'youtube_sub',
                value: value,
              }

              order.fisrt_value_log = fisrt_value_log

              let rs = await rootApiRequest.request({ 
                url: '/service/start', 
                method: 'POST',
                data: {
                  order,
                  customer_values: {
                    channel_id: channelID
                  }
                } 
              })
              
              if (rs.data.success) {
                channelIDsData.push({
                  channel_id: channelID,
                  service_id: rs.data.serviceRunning.id,
                  value: value,
                  fisrt_value_log
                })
                totalValue += value
              } else {
                console.log(rs);
                errorChannels.push(row[0])
                //return res.json({ status: 'error', message: 'Có lỗi xảy ra.' })
              }
            } catch (error) {
              errorChannels.push(row[0])
              console.log(error);
            }
          }

          await Promise.all(fileRows.map(row => {
            return createOrder(row)
          }))

          if (order) {
            await order.updateOne({ package: {}, 'customer_values.channel_ids_data': channelIDsData, 'customer_values.total_value': totalValue })
          }

          if (errorChannels.length) {
            return res.json({ success: false, errorChannels })
          }
          
          res.send({ success: true })
        }
        catch (e) {
          console.log('insert-profile-email err:', e)
          res.send(e)
        }
      })
      .on('error', function (e) {
        console.error('parse profile err:', e)
        res.send(e)
      })
  }
  catch (e) {
    console.log('insert-profile-email err:', e)
    res.send(e)
  }
});

module.exports = express.Router().use(router)
