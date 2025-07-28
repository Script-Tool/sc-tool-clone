var express = require('express');
var router = express.Router();
const utils = require('../../src/utils/utils')
router.post('/add-from-keywords', async function(req, res) {
  try {
    let data = req.body
    if (data.keywords) {
      let Playlist = getModel('Playlist')
      let code = utils.generateCode(utils.capitalizeFirstLetter(data.keyword), -1, false)
      for await (let keyword of data.keywords) {
        await Playlist.loadCreatePlaylistServices({ keyword: keyword, tags: code })
      }

      return res.json({ success: true, status: 'success', message: 'Create successfully.' })
    }

    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

module.exports = router;
