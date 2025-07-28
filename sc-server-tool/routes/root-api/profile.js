const express = require('express')
const router = express.Router()

router.get('/update-data', async function(req, res) {
  try {
    await getModel('Profile').updateOne({ id: req.query.pid }, req.query)
    
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/update-status', async function(req, res) {
  try {
    let update = { status: Boolean(req.query.status) }
    if (req.query.description) {
      update.description = req.query.description
    }
    await getModel('Profile').updateOne({ id: req.query.pid }, update)
    
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.get('/get-new-random', async function(req, res) {
  try {
    let filter = req.query
    filter.status = 'NEW'
    let countRs = await getModel('Profile').find(filter).countDocuments()
    let randomPosition = Math.floor(Math.random() * countRs)
    let profile = await getModel('Profile').findOne(filter).skip(randomPosition)

    if (profile) {
      //await profile.updateOne({ status: 'SYNCING' })
    }
    
    return res.json({profile})
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/create', async function(req, res) {
  try {
    let data = req.body
    await getModel('Profile').create(data)
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/collection', async function(req, res) {
  try {
    let Profile = getModel('Profile')
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

    let rows = await Profile.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
    let count = await Profile.find(filter).countDocuments()

    return res.json({ success: true, rows , count, current_page })
  } catch (error) {
      console.log('Error while get Profile collection')
  }
})

router.delete('/:id', async function(req, res) {
  try {
    await getModel('Profile').deleteOne({ _id: req.params.id })
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

module.exports = router;
