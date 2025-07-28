const express = require('express');
var router = express.Router();

router.get('/add', async function(req, res) {
  try {
    const data = req.query
    const ServicePackModel = getModel('ServicePack')

    if (data) {
      await ServicePackModel.create(data)
      return res.send({success: true})
    }

    res.send({success: false})
  } catch (error) {
      console.log(error);
  }
})

router.get('/update', async function(req, res) {
  try {
    const data = req.query
    const ServicePackModel = getModel('ServicePack')

    if (data) {
      await ServicePackModel.updateOne({ _id: data.package_id }, data)
      return res.send({success: true})
    }

    res.send({success: false})
  } catch (error) {
      console.log(error);
  }
})

router.get('/:id', async function(req, res) {
  try {
    const id = req.params.id
    if (id) {
      const ServicePackModel = getModel('ServicePack')
      const package = await ServicePackModel.findOne({ _id: id })
      return res.send({ success: true, package })
    }

    res.send({success: false})
  } catch (error) {
      console.log(error);
  }
})

router.delete('/:id', async function(req, res) {
  try {
    const id = req.params.id
    if (id) {
      const ServicePackModel = getModel('ServicePack')
      await ServicePackModel.deleteOne({ _id: id })
      return res.send({ success: true })
    }

    res.send({success: false})
  } catch (error) {
      console.log(error);
  }
})

module.exports = express.Router().use(router)
