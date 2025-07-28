const express = require('express');
var router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

router.post('/collection', async function(req, res) {
  try {
    let data = req.body
    data.filter.partner_id = req.customer._id.toString()
    let rs = await rootApiRequest.request({ 
      url: '/profile/collection', 
      method: 'POST',
      data,
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
      console.log('Error while get profile collection', error)
  }
})

router.post('/create', async function(req, res) {
  try {
    let data = req.body
    data.partner_id = req.customer._id.toString()
    let rs = await rootApiRequest.request({ 
      url: '/profile/create', 
      method: 'POST',
      data,
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
      console.log('Error while get profile create')
  }
})

router.delete('/:id', async function(req, res) {
  try {
    let rs = await rootApiRequest.request({ 
      url: '/profile/' + req.params.id, 
      method: 'delete',
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
      console.log('Error while get profile delete')
  }
})

module.exports = router;
