const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

router.post('/comment-service/create', async function(req, res) {
  let data = req.body

  if (data.channelID) {
    let script = await getModel('Script').findOne({ code: 'comment_youtube' })
    if (script) {
      let serviceData = {
        remaining: -1,
        script_code: 'comment_youtube',
        data: `
          {
            "channel_ids": "${data.channelID}",
            "video_ids": "",
            "playlist_ids": "",
            "commented_count_max": "",
            "comment_change_user": "",
            "comment": ""
          }
        `
      }

      if (script.default_service_data && script.default_service_data.start_max_time) {
        serviceData.start_max_time = script.default_service_data.start_max_time
        if (script.default_service_data.end_max_time) {
          serviceData.end_max_time = script.default_service_data.end_max_time
        }
      }

      let rs = await rootApiRequest.request({ 
        url: '/service/create', 
        method: 'POST',
        data: serviceData
      })
      
      if (rs.data.success) {
        return res.json({ success: true, status: 'success', message: 'Create successfully.' })
      }
    }
  }

  return res.json({ success: false })
})

router.get('/group', async function(req, res) {
  let ServicePackModel = await getModel('ServicePack')
  let packs = await ServicePackModel.find({ $or: [{ is_gift: { $exists: false } }, { is_gift: false }] })

  let hotpacks = []
  let multiplePack = []
  packs.forEach(pack => {
    if (pack.is_custom) {
      multiplePack.push(pack)
    } else {
      hotpacks.push(pack)
    }
  });

  let package_groups = [
    {
      label: 'Các dịch vụ HOT',
      packages: hotpacks
    }
  ]

  if (multiplePack.length) {
    package_groups.push({
      label: 'Các gói tùy chỉnh',
      packages: multiplePack
    })
  }

  return res.json({success: true, package_groups})
})

router.get('/gifts', async function(req, res) {
  try {
    let customer = req.customer
    let gifts = []
    
    if (customer && !customer.is_new) {
      return res.json({ success: false })
    }

    let PackModel = getModel('ServicePack')
    gifts = await PackModel.find({ is_gift: true })

    return res.json({ success: true, gifts })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/receiving-gifts', async function(req, res) {
  try {
    let customer = req.customer
    const PackageModel = getModel('ServicePack')
    const OrderModel = getModel('Order')
    if (customer && customer.is_new) {
      let gifts = await PackageModel.find({ is_gift: true })
      if (gifts.length) {
        for await (let gift of gifts) {
          let orderData = {
            package: gift,
            paid: 0,
            customer: customer.id,
          }
    
          await OrderModel.create(orderData)
        }

        await customer.updateOne({ is_new: false })
        return res.json({ success: true, status: 'success', message: 'Thành công, quà đã được thêm vào danh sách dịch vụ đã mua.' })
      }
    }

    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/start', async function(req, res) {
  try {
    let OrderModel = await getModel('Order')

    let orderID = req.body.order_id
    let customer_values = req.body.customer_values || null
    let order = await OrderModel.findOne({ id: orderID })
    let channel_ids_data
    let video_ids_data

    if (!customer_values && order.customer_values) {
      customer_values = order.customer_values
      if (customer_values.channel_ids_data) {
        channel_ids_data = customer_values.channel_ids_data
        delete customer_values.channel_ids_data
      }
      if (customer_values.video_ids_data) {
        video_ids_data = customer_values.video_ids_data
        delete customer_values.video_ids_data
      }
    }

    if (order) {
      if (order.status != 'wait_to_run') {
        return { status: 'error', message: 'Order completed.' }
      }

      if (order.package.type == 'api_key') {
        let KeyModel = await getModel('Key')

        let apiKey = await KeyModel.generateAPIKey()
        await KeyModel.create({
          key: apiKey,
          time: new Date(Date.now() + (1000 * 60 * 60) * 24 * Number(order.package.value)) ,
          status: true,
        })

        order.order_result = apiKey

      } else if (order.package.type == 'run_service') {
        // valid customer value
        if (order.package.script_code == 'youtube_sub') {
          if (customer_values.channel_id) {
            customer_values.channel_id = OrderModel.formatChannelId(customer_values.channel_id)
            let exist = await OrderModel.isExistChannel(customer_values.channel_id, order.id)
            if (exist) {
              return res.json(exist)
            }

            if (!customer_values.channel_id.includes('channel/') && !customer_values.channel_id.includes('user/') && !customer_values.channel_id.includes('c/')) {
              return res.json({ status: 'error', message: 'Định dạng không hợp lệ, vui lòng add ID kênh có dạng (channel/abc hoặc user/abc ... )' })
            }
          }

          if (customer_values.channel_ids) {
            let channelIds = customer_values.channel_ids.split(',')
            let ids = []
            if (channelIds && channelIds.length) {
              for await (let channel_id of channelIds) {
                channel_id = OrderModel.formatChannelId(channel_id)

                let exist = await OrderModel.isExistChannel(channel_id, order.id)
                if (exist) {
                  return res.json(exist)
                }

                if (!channel_id.includes('channel/') && !channel_id.includes('user/') && !channel_id.includes('c/')) {
                  return res.json({ status: 'error', message: 'Định dạng không hợp lệ, vui lòng add ID kênh có dạng (channel/abc hoặc user/abc ... )' })
                }
                ids.push(channel_id)
              }

              customer_values.channel_ids = ids.join(',')
            } else {
              return res.json({ status: 'error', message: 'Vui lòng không để trống channel ID' })
            }
          }
        } else if (order.package.script_code == 'watch_video') {
          if (video_ids_data) {

          } else {
            if (customer_values.playlist_url) {
              customer_values.playlist_url = OrderModel.formatVideoID(customer_values.playlist_url)
              let exist = await OrderModel.isExistVideoID(customer_values.playlist_url, order.id)
              if (exist) {
                return res.json(exist)
              }
              
              const rs = await OrderModel.getCurrentValue('watch_video', customer_values)
              let match = /P(?:(?<days>\d*)D)?T(?:(?<hours>\d*)H)?(?:(?<minutes>\d*)M)?(?:(?<seconds>\d*)S)/.exec(rs.items[0].contentDetails.duration);
              if (match && match.groups) {
                if (Number(match.groups['hours']) >= 1 || Number(match.groups['minutes']) > 50) {

                } else {
                  throw Error('Thời lượng video phải trên 50p.')
                }
              } else {
                throw Error('Không lấy được thời lượng video.')
              }

              if (rs && rs.items && rs.items[0]) {
                customer_values.keyword = rs.items[0].snippet.title
                customer_values.channel_title = rs.items[0].snippet.channelTitle
                order.fisrt_value_log = rs.items[0].statistics.viewCount
              } else {
                throw Error('Không tìm thấy kênh, vui lòng kiểm tra lại Video ID :'+customer_values.playlist_url)
              }
              
            } else {
              return res.json({ status: 'error', message: 'Vui lòng không để trống video ID' })
            }
          }
        }

        order.customer_values = customer_values
        order.status = 'running'
        
        if (order.package.script_code !== 'watch_video') {
          await order.processFirstValue()
        }

        // check try data
        if (order.package.is_gift && order.package.script_code == 'youtube_sub') {
          let orderExist = await OrderModel.findOne({ 'customer_values.channel_id': customer_values.channel_id })
          if (orderExist) {
            return res.json({ status: 'error', message: 'Kênh này đã được dùng thử trong 1 gói quà tặng khác, vui lòng dùng kênh khác.' })
          }
        }

        order.set('customer_name', req.customer.name)
        let rs = await rootApiRequest.request({ 
          url: '/service/start', 
          method: 'POST',
          data: {
            order,
            customer_values,
            channel_ids_data,
            video_ids_data
          } 
        })
        
        if (rs.data.success) {
          order.order_result = rs.data.serviceRunning.id
        } else {
          console.log(rs);
          return res.json({ status: 'error', message: 'Có lỗi xảy ra.' })
        }
      }

      await order.save()
      return res.json({ success: true, order, status: 'success', message: 'Khởi chạy hoàn tất' })
    }

    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    res.json({ status: 'error', message: error.message })
  }
})

module.exports = router;
