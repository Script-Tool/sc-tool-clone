const express = require('express');
var router = express.Router();
const modelName = 'FBProfile'

router.get('/delete', async function (req, res) {
  try {
    let id = req.query.id
    let Model = getModel(modelName)
    await Model.deleteOne({ _id: id })
    res.send({})
  }
  catch (e) {
    console.log('error', 'delete err: ', e)
    res.send({ err: e })
  }
})

router.get('/save', async function (req, res) {
  try {
    console.log('-5054554636')
    let data = req.query
    let Model = await getModel(modelName)
    if (data.rowID) {
      await Model.updateOne({ _id: data.rowID }, data)
    } else {
      console.log('data', data)
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
    let filter = {}
    if (req.query.set_id && req.query.set_id != 'null') {
      filter.set_id = req.query.set_id
    }
    console.log('filter', filter);
    let Model = await getModel(modelName)
    await Model.deleteMany(filter)
    res.send({ success: true })
  }
  catch (e) {
    res.send({ err: e })
  }
})

module.exports = express.Router().use(router)
