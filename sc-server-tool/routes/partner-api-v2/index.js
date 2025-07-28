const express = require('express');
const router = express.Router();

router.get('/system-config', async function(req, res) {
  res.json({ success: true, config: youtube_config })
})

router.get('/scripts-active', async function(req, res) {
  let scripts = await getModel('Script').find({ status: true })
  res.json({ success: true, scripts })
})

router.get('/dashboard-info', async function(req, res) {
  let partner_id = req.params.partner_id
  if (!partner_id) {
    return res.json({ success: false, message: 'partner_id is required.' })
  }

  let partnerFilter = {
    partner_id
  }

  let values = {
    profileCount: await getModel('Profile').countDocuments(partnerFilter),
    proxyCount: await getModel('Proxy').countDocuments(partnerFilter),
    serviceCount: await getModel('Service').countDocuments(partnerFilter),
    commentCount: await getModel('Comment').countDocuments(partnerFilter),
  }
  res.json({ success: true, values })
})

// profile
router.get('/random-profile', async function(req, res) {
  let partner_id = req.params.partner_id
  if (!partner_id) {
    return res.json({ success: false, message: 'partner_id is required.' })
  }
  const ProfileModel = getModel('Profile')
  let filter = {
    partner_id
  }
  let countRs = await ProfileModel.countDocuments(filter)
  let randomPosition = Math.floor(Math.random() * countRs)
  let profile = await ProfileModel.findOne(filter).skip(randomPosition)

  res.json({ success: true, profile })
})
//--------
// proxy
router.get('/random-proxy', async function(req, res) {
  let partner_id = req.params.partner_id
  if (!partner_id) {
    return res.json({ success: false, message: 'partner_id is required.' })
  }
  const ProxyModel = getModel('Proxy')
  let proxyFilter = {
    partner_id
  }
  let countRs = await ProxyModel.countDocuments(proxyFilter)
  let randomPosition = Math.floor(Math.random() * countRs)
  let proxy = await ProxyModel.findOne(proxyFilter).skip(randomPosition)

  res.json({ success: true, proxy })
})
//------

// service
router.get('/services', async function(req, res) {
  let script_code = req.params.script_code
  let partner_id = req.params.partner_id
  let req_pagination = req.params.pagination

  if (!partner_id) {
    return res.json({ success: false, message: 'partner_id is required.' })
  }

  let pagination = {
    per_page: 50,
    current_page: 1,
  }

  if (req_pagination) {
    pagination = req_pagination
  }
  let services = await getModel('Service').find({ partner_id, script_code }).skip((pagination.current_page - 1) * pagination.per_page).limit(pagination.per_page)
  res.json({ success: true, services })
})

router.get('/random-service', async function(req, res) {
  let scripts = req.params.scripts_code
  let partner_id = req.params.partner_id

  try{
    let Script = getModel('Script')
    let Service = await getModel('Service')

    let founded = false
    for await (let script of scripts) {
      const sv = await getService(script)
      if (sv) {
        founded = true
        return res.send(sv)
      }
    }

    if (founded) {
      return
    }

    async function getService (scriptCode) {
      let script = await Script.findOne({ code: scriptCode })
      if (!script.status) {
        return
      }

      let availableServices = []
      let serviceFilter = {
        partner_id: partner_id,
        is_stop: { $ne: true },
        script_code: script.code,
        start_max_time: { $in: [null, 0, false] },
        $or: [ 
          { remaining: { $gt: 0 } },
          { remaining: -1, script_code: { $nin: ['comment_youtube', 'like_youtube', 'youtube_sub'] } }
        ]
      }

      let totalSv = await Service.countDocuments(serviceFilter)
      let randomPosition = Math.floor(Math.random() * totalSv)

      availableServices = await Service.findOne(serviceFilter).skip(randomPosition)
      if (availableServices) {
        availableServices = [availableServices]
      }

      if (!availableServices || !availableServices.length) {
        return
      }

      availableServices = await Service.loadDefaultConfig(availableServices)

      availableServices = shuffleArray(availableServices)

      for await (let service of availableServices) {
        if (service.data) {
          let update = {
            last_report_time: Date.now()
          }
          if (service.remaining != -1 && !service.start_max_time) {
            update['$inc'] = { remaining: -1 }
          }

          await service.updateOne(update)
          try {
            let afterRs = await service.handleData(script, '', { pid: req.query.pid })
            if (afterRs) {
              afterRs.success = true
              return afterRs
            } else {
              return { not_found: true }
            }
          } catch (error) {
            throw error
          }
        }
      }
    }
    
    res.send({})
  }
  catch (e) {
      console.log('error','update-channel err: ',e)
      res.send({err: e.message})
  }
})

router.get('/report-service', async function(req, res) {
  try{
    let Service = await getModel('Service')

    let service
    if (req.query._id) {
      service = await Service.findOne({_id : req.query._id}, 'data one_time script_code first_data_reported data_reported start_max_time remaining executed fisrt_remaining')
    } else {
      return { success: false, error: 'Missing service id' }
    }

    if (!service) {
      console.log('Not found report service')
      return res.json({ success: false, message: 'Not found report service' })
    }

    if (service.script_code == 'get_otp') {
      ready_recovery_mail = ready_recovery_mail.filter(p => p != req.query.pid)
    } else if (service.script_code == 'add_recovery_mail') {
      delete wait_code[req.query.pid]
    }

    if (req.query.status && req.query.status != 'false') {
      let update = { $inc: { executed: 1 }, last_report_time: Date.now() }
      // if (service.remaining == 1) {
      //   if (['folow_fb', 'youtube_sub', 'fb_add_member'].includes(service.script_code)) {
      //     // add to stack bh
      //     addSub(service._id)
      //   }
      // }

      // if (service.script_code == 'youtube_sub' && service.fisrt_remaining) {
      //   try {
      //     if (service.remaining + service.executed < service.fisrt_remaining) {
      //       let add = service.fisrt_remaining - (service.remaining + service.executed) + 10
      //       if (add > 500) {
      //         console.log('add-', add);
      //       }
      //       if (add) {
      //         await service.updateOne({ $inc: { remaining: add } })
      //       }
      //     }
      //   } catch (error) {
      //     console.log('err while add sub', error);
      //   }
      // }

      if (service.remaining > 0) {
        update['$inc'] = {...update['$inc'], remaining: -1 }
      }

      if (req.query.data_reported) {
        if (!service.first_data_reported) {
          update.first_data_reported = req.query.data_reported
        }
        update.data_reported = req.query.data_reported

        if (service.script_code == 'add_video_playlist') {
          service = await Service.findOne({_id : req.query._id}, 'note data one_time script_code first_data_reported data_reported start_max_time remaining')
          // get data view and video count
          let data = getJctReportData(update.data_reported)
          let total_video = data.total_video
          let total_view = data.total_view

          if (total_video) {
            let PlaylistJCT = getModel("PlaylistJCT")

            if (!Number(total_view)) {
              total_view = 0
            }

            let serviceData = null
            try {
              serviceData = JSON.parse(service.data)
            } catch (error) {
              console.log(error);
            }
            
            if (serviceData) {
              let jct_playlist = await PlaylistJCT.findOne({
                url: serviceData.playlist_url,
              })
  
              if (jct_playlist) {
                await jct_playlist.updateOne({ total_video, total_view, tag: service.note, })
              }
            }
          }
        }
      }
  
      await service.updateOne(update)
    } else {
      if (service.remaining != -1) {
        await service.updateOne({ $inc: { remaining: 1 } })
      }
    }

    res.send({ success: true })
  }
  catch (e) {
      console.log('error','report script err: ',e)
      res.send({err: e.message})
  }
})

module.exports = router;