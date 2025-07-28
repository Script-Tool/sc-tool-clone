const express = require('express');
const router = express.Router();
const rootApiRequest = require('../../modules/root-api-request')

const name = 'proxy'

router.post('/collection', async function(req, res) {
  try {
    let data = req.body
    data.filter.partner_id = req.customer._id.toString()
    let rs = await rootApiRequest.request({ 
      url: `/${name}/collection`, 
      method: 'POST',
      data,
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
    console.log(`Error while get ${name} collection`, error)
  }
})

router.post('/create', async function(req, res) {
  try {
    let data = req.body
    data.partner_id = req.customer._id.toString()
    let rs = await rootApiRequest.request({ 
      url: `/${name}/create`, 
      method: 'POST',
      data,
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
    console.log(`Error while ${name} create`, error)
  }
})

router.delete('/:id', async function(req, res) {
  try {
    let rs = await rootApiRequest.request({ 
      url: `/${name}/` + req.params.id, 
      method: 'delete',
    })

    if (rs.data) {
      return res.json(rs.data)
    }
  } catch (error) {
    console.log(`Error while ${name} delete`, error)
  }
})

module.exports = router;
