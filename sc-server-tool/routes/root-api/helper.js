var express = require('express');
var router = express.Router();

router.get('/get-config', async function(req, res) {
  let ignoreKeys = [
    'suggest_percent', 'page_watch', 'direct_percent', 'search_percent',
    'percent_view_channel_youtube', 'update_key', 'codesim_api_key', 'ndline_api_key', 'viotp_api_key',
    'watching_time_non_ads', 'watching_time_start_ads', 'watching_time_end_ads', 'total_times_next_video', 'chothuesimcode_api_key',
    'gpt_script_template_suffix', 'gpt_script_template', 'gpt_template', 'chat_gpt_api_key'
  ]
  let dataMaped = {}
  Object.keys(youtube_config).forEach(key => {
    if (!ignoreKeys.includes(key) && youtube_config[key] != '') {
      dataMaped[key] = youtube_config[key]
    }
  });
  return res.json(dataMaped)
});

router.get('/dashboard', async function(req, res) {
  let data = {
    profiles: await getModel('Profile').countDocuments({ partner_id: req.query.partner_id }),
    proxy: await getModel('Proxy').countDocuments({ partner_id: req.query.partner_id }),
    images: await getModel('Image').countDocuments({ partner_id: req.query.partner_id }),
    comments: await getModel('Comment').countDocuments({ partner_id: req.query.partner_id }),
    contents: await getModel('ContentRepo').countDocuments({ partner_id: req.query.partner_id }),
  }

  return res.json({ success: true, overviewData: data })
});

module.exports = router;
