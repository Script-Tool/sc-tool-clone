const express = require('express');
var router = express.Router();
const modelName = 'FBGroupSet'

router.get('/delete', async function (req, res) {
  try {
    let id = req.query.id
    let Model = getModel(modelName)
    await Model.deleteOne({ _id: id })
    await getModel('FBContent').deleteMany({ set_id: id })
    await getModel('FBGroup').deleteMany({ set_id: id })
    res.send({})
  }
  catch (e) {
    console.log('error', 'delete err: ', e)
    res.send({ err: e })
  }
})

router.get('/save', async function (req, res) {
  try {
    let data = req.query
    let Model = await getModel(modelName)
    if (data.rowID) {
      await Model.updateOne({ _id: data.rowID }, data)
    } else {
      // check exist
      let exist = await Model.findOne({ name: data.name })
      if (exist) {
        return res.send({ success: false, message: 'Tên đã tồn tại.' })
      }
      await Model.create(data)
    }

    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.get('/detail', async function (req, res) {
  try {
    let id = req.query.id
    let Model = await getModel(modelName)
    if (id) {
      let doc = await Model.findOne({ _id: id })
      return res.send({ success: true, doc })
    }

    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

router.get('/delete-all', async function (req, res) {
  try {
    let Model = await getModel(modelName)
    await Model.deleteMany()
    await getModel('FBContent').deleteMany()
    await getModel('FBGroup').deleteMany()
    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

module.exports = express.Router().use(router)
