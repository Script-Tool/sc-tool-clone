var express = require('express');
var router = express.Router();

router.post('/create', async function(req, res) {
  try {
    let data = req.body
    console.log(data);
    await getModel('Comment').create({
      partner_id: data.partner_id,
      content: data.content,
      target: data.target,
    })
    return res.json({ success: true })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/collection', async function(req, res) {
  try {
    let CommentModel = getModel('Comment')
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

    let rows = await CommentModel.find(filter).sort({ createdAt: -1 }).skip((current_page - 1) * per_page).limit(per_page)
    let count = await CommentModel.find(filter).countDocuments()

    return res.json({ success: true, rows , count, current_page })
  } catch (error) {
      console.log('Error while get comments collection')
  }
})

router.delete('/:id', async function(req, res) {
  await getModel('Comment').deleteOne({ _id: req.params.id })
  return res.json({ success: true })
})

module.exports = router;
