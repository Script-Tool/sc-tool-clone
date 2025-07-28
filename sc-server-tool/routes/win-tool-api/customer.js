const express = require('express');
const router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

router.get('/reload-api-key', async function(req, res) {
  let newAPIKey = await req.customer.reLoadApiKey()
  return res.json({ success: true, newAPIKey })
})

router.post('/update-info', async function(req, res) {
  if (req.body.info) {
    try {
      await getModel('Customer').updateOne({ id: req.customer.id }, { info: req.body.info })
      return res.json({ success: true, info: req.body.info })
    } catch (error) {
      console.log(error);
    }
  }
  return res.json({ success: false })
})

module.exports = router;
