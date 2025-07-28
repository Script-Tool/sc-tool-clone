const express = require('express');
var router = express.Router();

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
