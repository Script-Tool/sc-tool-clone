const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../../modules/root-api-request')

router.get('/script/get-new', async function(req, res) {
  let pid = req.query.pid
  if (!pid) {
    return res.json({ success: false, message: 'pid is required.' })
  }

  let count = 1
  let currentPidCount = 0
  for (let script of req.customer.scripts_running) {
    if (!Array.isArray(req.customer.scripts_running.pids)) {
      req.customer.scripts_running.pids = []
    }
    if (script.pids && script.pids.includes(pid)) {
      script.pids = script.pids.filter(_p => _p != pid)
      currentPidCount = count + 1
      break
    }
    count++
  }
  if (!currentPidCount || currentPidCount > req.customer.scripts_running.length) {
    currentPidCount = 1
  }
  let currentScript = req.customer.scripts_running[currentPidCount-1]
  currentScript.pids = [...new Set([...req.customer.scripts_running.pids, pid])]
  await req.customer.updateOne({ scripts_running: req.customer.scripts_running })

  let getServiceParams = {
    script_code: currentScript.code,
    pid,
    customer_id: req.customer._id.toString(),
  }
  let rs = await rootApiRequest.request({ 
    url: '/service/get-random-service',
    method: 'GET',
    params: getServiceParams
  })
  if (rs && rs.data && rs.data.service) {
    let serviceData = rs.data.service
    if (serviceData) {
      serviceData.is_break = currentScript.is_break
    }
    return res.json(rs.data.service)
  }

  return res.json({ success: false })
})

router.get('/script/report', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/service/report-service',
    method: 'GET',
    params: {...req.query, customer_id: req.customer._id}
  })
  if (rs && rs.data) {
    return res.json({ success: true })
  }

  return res.json({ success: false })
})

router.get('/config/system', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/helper/get-config',
    method: 'GET',
  })
  if (rs && rs.data) {
    let config = {...rs.data, ...req.customer.config}
    return res.json(config)
  }
})

router.get('/proxy/get-profile-proxy', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/proxy/get-random',
    method: 'GET',
    params: {
      partner_id: req.customer._id.toString()
    }
  })
  return res.json(rs.data)
})

// profile ---
router.post('/profile/update-status', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/profile/update-status',
    method: 'GET',
    params: {
      partner_id: req.customer._id.toString(),
      pid: req.body.pid,
      status: req.body.status,
      description: req.body.description,
    }
  })
  return res.json(rs.data)
})

router.post('/profile/update-data', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/profile/update-data',
    method: 'GET',
    params: req.body
  })
  return res.json(rs.data)
})

router.get('/profile', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/profile/get-new-random',
    method: 'GET',
    params: {
      //partner_id: req.customer._id.toString(),
      type: req.query.type,
    }
  })

  if (rs.data && rs.data.profile) {
    Object.assign(rs.data.profile, req.customer.info || {})
  }
  return res.json(rs.data)
})
//---
router.get('/media/random-image', async function(req, res) {
  let rs = await rootApiRequest.request({ 
    url: '/image/get-random',
    method: 'GET',
    params: {
      partner_id: req.customer._id.toString(),
    }
  })
  return res.json(rs.data)
})

module.exports = router;