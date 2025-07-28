const express = require('express');
var router = express.Router();

router.get('/add', async function(req, res) {
  try {
      let data = req.query
      let ProxyV4 = await getModel('ProxyV4')
      if (data.api_key) {
        await ProxyV4.create({
          server: data.api_key
        })
      }
      
      res.send({success: true})
  } catch (error) {
      console.log(error);
  }
})

router.get('/delete', async function(req, res) {
  try{
    console.log('delete:',req.query)
    let id = req.query.id
    let ProxyV4 = await getModel('ProxyV4')
    await ProxyV4.deleteOne({_id: id})
    res.send({})
  }
  catch (e) {
      console.log('error','update-playlist err: ',e)
      res.send({err: e})
  }
})



module.exports = express.Router().use(router)