const express = require('express');
const router = express.Router();

const gptModule = require('../../modules/gpt-script')

router.post('/create-comment-service-by-ai', async function(req, res) {
  try {
    let content = await gptModule.generateContent(req.body)

    if (content) {
      content = content.split('\n')
      let youtube = []
      let tiktok = []
      let facebook = []
      let rs = []
      content.forEach(item => {
        item = item.trim()
        if (['1','2','3','4','5','6','7','8','9','10', '-'].includes(item[0])) {
          rs.push({ key: item })
        }
      })

      const count = rs.length / 3
      youtube = rs.splice(0, count)
      tiktok = rs.splice(0, count)
      facebook = rs.splice(0, count)

      let data = {
        youtube,
        tiktok,
        facebook,
        success: true,
      }
      return res.json(data)
    }

    return res.json({ success: true })
  } catch (error) {
    console.log('Error while get generateContent')
  }
})

router.post('/collection', async function(req, res) {
  try {
    let ServiceModel = getModel('Service')
    let filter = {}

    let current_page = 1
    let per_page = 50

    if (req.body.filter) {
      filter = { ...filter, ...req.body.filter }
    }
    if (req.body.pagination) {
      current_page = req.body.pagination.current_page
      per_page = req.body.pagination.per_page
    }
  
    let rows = await ServiceModel.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
    let count = await ServiceModel.find(filter).countDocuments()

    return res.json({ success: true, rows, count, current_page })
  } catch (error) {
      console.log('Error while get comments collection')
  }
})

router.delete('/:id', async function(req, res) {
  await getModel('Service').deleteOne({ _id: req.params.id })
  return res.json({ success: true })
})

router.post('/create', async function(req, res) {
  try {
    let data = req.body
    let ServiceModel = getModel('Service')

    let defaultServiceData = {}
    let script = await getModel('Script').findOne({ code: data.script_code })

    let customData = {}
    if (script && script.default_service_data) {
      customData = JSON.parse(script.default_service_data.data)
    }

    if (script.data_inputs) {
      script.data_inputs.forEach(data_input => {
        if (data[data_input.code]) {
          customData[data_input.code] = data[data_input.code]
        }
      })
      defaultServiceData.data = JSON.stringify(customData)
    }

    defaultServiceData.script_code = data.script_code
    defaultServiceData.remaining = data.remaining
    defaultServiceData.partner_id = data.partner_id
    await ServiceModel.create(defaultServiceData)

    return res.json({ success: true })
  } catch (error) {
    console.log(error)
    return res.json({ success: false })
  }
})

router.get('/get-random-service', async function(req, res) {
  let scriptCode = req.query.script_code
  let customerID = req.query.customer_id
  let pid = req.query.pid
  const ServiceModel = getModel('Service')
  try {
    const script = await getModel('Script').findOne({ code: scriptCode })
    let filter = {
      script_code: scriptCode,
      partner_id: customerID,
      $or: [ 
        { remaining: { $gt: 0 } },
        { remaining: -1 },
      ]
    }

    let countRs = await ServiceModel.find(filter).countDocuments()
    let randomPosition = Math.floor(Math.random() * countRs)
    let service = await ServiceModel.findOne(filter).skip(randomPosition)
    if (service) {
      service = await ServiceModel.loadDefaultConfig(service)
      service = service[0]
      let dataService = await service.handleData(script, '', { pid, partner_id: customerID })
      if (service.remaining != -1) {
        await service.updateOne({ $inc: { remaining: -1 } })
      }
      
      return res.json({ success: true, service: dataService })
    }
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/report-service', async function(req, res) {
  let params = req.query
  const ServiceModel = getModel('Service')
  try {
    let service = await ServiceModel.findOne({ _id: params._id })
    if (service) {
      if (params.data_reported) {
        await service.updateOne({ data_reported: params.data_reported })
      }
      return res.json({ success: true })
    }
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/create', async function(req, res) {
  try {
    const body = req.body
    if (body.script_code) {
      const ServiceModel = getModel('Service')

      let sv = await ServiceModel.create(body)
      if (sv) {
        return res.json({ success: true })
      } else {
        return res.json({ success: false })
      }
    }
    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/check-channel-id-exist', async function(req, res) {
  const body = req.body
  if (body.channelID) {
    const ServiceModel = getModel('Service')
    let query = {
      script_code: 'youtube_sub',
      remaining: 0,
      data: { $regex: body.channelID }
    }

    let sv = await ServiceModel.findOne(query)
    if (sv) {
      return res.json({ success: true, exist: true })
    } else {
      return res.json({ success: true, exist: false })
    }
  }
  return res.json({ success: false })
})

router.post('/delete', async function(req, res) {
  const body = req.body
  if (body.service_id) {
    const ServiceModel = getModel('Service')
    let query = {}
    if (Number(body.service_id)) {
      query.id = Number(body.service_id)
    } else {
      query._id = body.service_id
    }

    await ServiceModel.remove(query)
    return res.json({ success: true })
  }
  return res.json({ success: false })
})

router.post('/set-service-status', async function(req, res) {
  const body = req.body
  if (body.ids) {
    let status = Boolean(Number(body.status))
    const ServiceModel = getModel('Service')
    await ServiceModel.updateMany({id: { $in: body.ids }}, { is_stop: !status })
    return res.json({ success: true })
  }
  return res.json({ success: false })
})

router.post('/additional', async function(req, res) {
  const body = req.body
  const ServiceModel = getModel('Service')
  
  if (body.service_id && Number(body.additional_value)) {
    let query = {}
    if (Number(body.service_id)) {
      query.id = Number(body.service_id)
    } else {
      query._id = body.service_id
    }

    await ServiceModel.updateOne(query, { $inc: { remaining: Number(body.additional_value) } })
    return res.json({ success: true })
  } else if (body.adjust_list) {
    for await (let item of body.adjust_list) {
      if (item.service_id) {
        await ServiceModel.updateOne({id: item.service_id}, { $inc: { remaining: Number(item.additional_value) } })
      } else if (item.data_id) {
        await ServiceModel.updateOne({data: { $regex: item.data_id }, note: `order-${item.order_id}`}, { $inc: { remaining: Number(item.additional_value) } })
      }
    }
    return res.json({ success: true })
  }

  return res.json({ success: false })
})

router.post('/start', async function(req, res) {
  let body = req.body
  if (body.order && body.customer_values) {
    const ServiceModel = getModel('Service')
    let serviceRunning = {}
    const order = body.order
    const customer_values = body.customer_values
    if ((order.package.script_code == 'youtube_sub' && customer_values.channel_ids) || (order.package.script_code == 'watch_video' && body.video_ids_data)) {
      let channelIds = []
      if (order.package.script_code == 'youtube_sub') {
        channelIds = customer_values.channel_ids.split(',')
      } else if (order.package.script_code == 'watch_video') {
        channelIds = Object.keys(body.video_ids_data)
      }
      delete customer_values.channel_ids
      for await (let id of channelIds) {
        let _customerValue = {}
        if (body.channel_ids_data && body.channel_ids_data[id]) {
          order.fisrt_value_log = body.channel_ids_data[id].fisrt_value_log
          _customerValue = { ...customer_values, channel_id: id }
        } else if (body.video_ids_data && body.video_ids_data[id]) {
          _customerValue = {
            channel_title: body.video_ids_data[id].channel_title,
            keyword: body.video_ids_data[id].keyword,
            playlist_url: id
          }
          order.fisrt_value_log = body.video_ids_data[id].fisrt_value_log
        }
        serviceRunning = await ServiceModel.addServiceFromPackageData(order, _customerValue)
      }

    } else if (order.package.script_code == 'verify_mail') {
      serviceRunning = true
      const ProfileModel = getModel('Profile')
      const mails = customer_values.mails
      for await (let mail of mails) {
        await ProfileModel.create({
          email: mail.email,
          password: mail.password,
          recover_mail: mail.recover_mail,
          description: 'ver_' + order.id,
        })
      }
    } else {
      serviceRunning = await ServiceModel.addServiceFromPackageData(body.order, body.customer_values)

    }

    if (serviceRunning) {
      return res.json({ success: true, serviceRunning })
    }
  }

  return res.json({ success: false })
});

router.post('/collection', async function(req, res) {
  let body = req.body
  const ServiceModel = getModel('Service')
  let filter = body.filter || {}
  let limit = body.limit || 50
  let current_page = body.current_page
  let select = body.select || ''
  let services = await ServiceModel.find(filter, select).skip((current_page - 1) * limit).limit(limit)
  const total = await ServiceModel.countDocuments(filter)
  if (services) {
    return res.json({ success: true, services, total })
  }

  return res.json({ success: false })
});

router.get('/get-by-note/:note', async function(req, res) {
  let note = req.params.note
  const ServiceModel = getModel('Service')

  if (note) {
    let services = await ServiceModel.find({ note }, 'executed remaining')
    if (services) {
      let remainingData = 0
      let totalValue = 0
      services.forEach(service => {
        remainingData += service.executed
        totalValue += service.remaining
      });
      return res.json({ success: true, remainingData, totalValue })
    }
  }

  return res.json({ success: false })
});

router.get('/:id', async function(req, res) {
  let serviceId = req.params.id
  const ServiceModel = getModel('Service')

  if (serviceId) {
    let query = {}
    if (Number(serviceId)) {
      query.id = Number(serviceId)
    } else {
      query._id = serviceId
    }

    let service = await ServiceModel.findOne(query)
    if (service) {
      return res.json({ success: true, service })
    }
  }

  return res.json({ success: false })
});

module.exports = router;
