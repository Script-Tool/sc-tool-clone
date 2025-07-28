var express = require('express');
var router = express.Router();

router.get('/get-active-scripts', async function(req, res) {

  const scripts = await getModel('Script').find({ status: true }, 'name code status').catch(err => {
    console.log('get-active-scripts error: ', err);
    return []
  })

  return res.json({ success: true, scripts })
});

router.get('/script-detail/:code', async function(req, res) {
  const script = await getModel('Script').findOne({ code: req.params.code }, 'name code data_inputs')
  return res.json({ success: true, script })
});

module.exports = router;
