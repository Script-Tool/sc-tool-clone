const express = require('express');
var router = express.Router();
const checkMailModule = require('../../modules/check-mail')

router.post('/', async function (req, res) {
  try {
    let data = req.body
    let mails = data.mails.split('\n')
    let rs = await checkMailModule.checkMail(mails)

    if (rs.data) {
      return res.json({ success: true, checkData: rs.data.data })
    }

    return res.json({ success: false })
  }
  catch (e) {
    console.log('error', e.response.data)
    let error = ''
    if (e.response.data.errors[0]) {
      error = e.response.data.errors[0]
    }
    
    return res.json({ success: false, status: 'error', message: error })
  }
})

module.exports = router;
