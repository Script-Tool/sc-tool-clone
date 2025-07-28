const express = require('express');
var router = express.Router();


router.get('/get-playlist', async function(req, res) {
    try{
        let id = req.query.lid
        let Playlist = await getModel('Playlist')

        let rs = await Playlist.findOne({_id: id})

        if (rs) {
            return res.send(rs)
        }
        return res.send({ success: false })
    }
    catch (e) {
        console.log('error','update playlist err: ',e)
        res.send({err: e})
    }
});

router.get('/update-data', async function(req, res) {
    try{
        let data = req.query
        let Playlist = await getModel('Playlist')
        if (!data.vm_names) {
            data.vm_names = []
        }
        await Playlist.updateOne({_id: data.lid}, data)

        return res.send({ success: true })
    }
    catch (e) {
        console.log('error','update playlist err: ',e)
        res.send({err: e})
    }
});

router.get('/add-playlist', async function(req, res) {
  try{
      let video = req.query
      let Playlist = await getModel('Playlist')
      await Playlist.create(video)

      res.send({ success: true })
  }
  catch (e) {
      console.log('error','create video err: ',e)
      res.send({err: e})
  }
});

router.get('/delete-all', async function(req, res) {
    try {
        let Playlist = await getModel('Playlist')
        await Playlist.deleteMany()
        res.send({success: true})
    } catch (error) {
        console.log(error);
    }
})

module.exports = express.Router().use(router)
