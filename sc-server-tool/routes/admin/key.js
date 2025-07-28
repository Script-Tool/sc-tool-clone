const express = require('express');
var router = express.Router();

router.get('/generate-key', async function (req, res) {
  try {
    let KeyModel = await getModel('Key')
    let key = await KeyModel.generateAPIKey()
    res.send({ key: key })
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.get('/delete', async function (req, res) {
  try {
    let id = req.query.id
    let Model = getModel('Key')
    await Model.deleteOne({ _id: id })
    res.send({})
  }
  catch (e) {
    console.log('error', 'delete err: ', e)
    res.send({ err: e })
  }
})

router.get('/add', async function (req, res) {
  try {
    let data = req.query
    let KeyModel = await getModel('Key')
    if (data.key && data.time) {
      let d = new Date(Date.now() + (1000 * 60 * 60) * 24 * Number(data.time))
      data.time = d.getTime()

      await KeyModel.create({
        key: data.key,
        time: data.time,
        status: true
      })
    }

    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.get('/delete-all', async function (req, res) {
  try {
    let KeyModel = await getModel('Key')
    await KeyModel.deleteMany()
    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

module.exports = express.Router().use(router)
