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
  let rs = await rootApiRequest.request({ 
    url: '/helper/dashboard?partner_id=' + req.customer._id.toString(), 
    method: 'GET',
  })

  if (rs.data && rs.data.overviewData) {
    rs.data.overviewData.api_key = req.customer.api_key
  }
  return res.json(rs.data)
})

module.exports = router;
