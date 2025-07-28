const express = require('express');
const router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

router.get('/scripts', async function(req, res) {
  let currentScriptCodes = req.customer.scripts_running
  let rs = await rootApiRequest.request({ 
    url: '/script/get-active-scripts',
    method: 'GET',
  })

  let scripts = []
  if (rs.data.success) {
    if (!Array.isArray(currentScriptCodes)) {
      currentScriptCodes = []
    }
    let rootScripts = rs.data.scripts
    let unactiveScripts = []
    currentScriptCodes = currentScriptCodes.filter(_script => rootScripts.some(rootScript => rootScript.code == _script.code))
    let count = 0
    currentScriptCodes = currentScriptCodes.map(_script => {
      const rootScript = rootScripts.find(_rootScript => _rootScript.code == _script.code)
      rootScript.position = count
      rootScript.status = true
      rootScript.is_break = _script.is_break
      count++
      return rootScript || {}
    })

    unactiveScripts = rootScripts.filter(_rootScript => !currentScriptCodes.some(_script => _script.code == _rootScript.code))
    unactiveScripts = unactiveScripts.map(script => {
      script.status = false
      return script
    })

    scripts = [...currentScriptCodes, ...unactiveScripts]
  }
  return res.json({ success: true, scripts })
})

router.get('/update-status', async function(req, res) {
  let updateValue = req.query.value
  let scriptCode = req.query.script_code

  if (!scriptCode) {
    return res.json({ success: false, message: 'script_code is required.' })
  }

  if (!Array.isArray(req.customer.scripts_running)) {
    req.customer.scripts_running = []
  }

  if (updateValue && !req.customer.scripts_running.some(item => item.code == scriptCode)) {
    req.customer.scripts_running.push({ code: scriptCode })
  } else {
    req.customer.scripts_running = req.customer.scripts_running.filter(scriptRunning => scriptRunning.code != scriptCode)
  }

  await req.customer.updateOne({ scripts_running: req.customer.scripts_running })
  return res.json({ success: true })
})

router.get('/update-break', async function(req, res) {
  let updateValue = req.query.value
  let scriptCode = req.query.script_code
  if (!scriptCode) {
    return res.json({ success: false, message: 'script_code is required.' })
  }

  if (!Array.isArray(req.customer.scripts_running)) {
    req.customer.scripts_running = []
  }

  req.customer.scripts_running.forEach(script => {
    if (script.code == scriptCode) {
      script.is_break = updateValue == 'false' ? false : Boolean(updateValue)
    }
  })

  await req.customer.updateOne({ scripts_running: req.customer.scripts_running })
  return res.json({ success: true })
})

router.get('/update-position', async function(req, res) {
  let positionValue = req.query.position_value
  if (!positionValue) {
    return res.json({ success: false, message: 'positionValue is required.' })
  }
  req.customer.scripts_running = positionValue.map(posCode => {
    let script = req.customer.scripts_running.find(scriptRunning => scriptRunning.code == posCode)
    return script || {}
  })

  await req.customer.updateOne({ scripts_running: req.customer.scripts_running })
  return res.json({ success: true })
})

router.get('/detail/:code', async function(req, res) {
  let script_code = req.params.code
  let rs = await rootApiRequest.request({ 
    url: '/script/script-detail/' + script_code,
    method: 'GET',
  })

  return res.json(rs.data)
})

module.exports = router;
