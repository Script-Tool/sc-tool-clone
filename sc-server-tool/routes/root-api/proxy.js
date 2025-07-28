const express = require('express')
const router = express.Router()

router.get('/get-random', async function(req, res) {
  try {
    let filter = req.query
    let countRs = await getModel('Proxy').find(filter).countDocuments()
    let randomPosition = Math.floor(Math.random() * countRs)
    let proxy = await getModel('Proxy').findOne(filter).skip(randomPosition)
    return res.json(proxy)
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/create', async function(req, res) {
  try {
    let data = req.body
    await getModel('Proxy').create(data)
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/collection', async function(req, res) {
  try {
    let Proxy = getModel('Proxy')
    let filter = {}

    let current_page = 1
    let per_page = 50

    if (req.body.filter) {
      filter = { ...filter, ...req.body.filter }
    }

    if (req.body.pagination) {
      current_page = req.body.pagination.current_page
      per_page = req.body.pagination.per_page
    }

    let rows = await Proxy.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
    let count = await Proxy.find(filter).countDocuments()

    return res.json({ success: true, rows , count, current_page })
  } catch (error) {
      console.log('Error while get Proxy collection')
  }
})

router.delete('/:id', async function(req, res) {
  try {
    await getModel('Proxy').deleteOne({ _id: req.params.id })
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

module.exports = router;
