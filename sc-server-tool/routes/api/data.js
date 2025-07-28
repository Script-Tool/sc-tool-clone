const express = require('express');
var router = express.Router();

router.get('/comment', async function (req, res) {
  try {
    let type = req.query.type
    const Comment = await getModel('Comment')
    let comment = await Comment.getRandomComment(type)
    if (comment) {
      return res.json({ comment: comment })
    }
    return res.json({ comment: '', error: 'Not found comment' })
  }
  catch (e) {
    console.log('error', e)
    res.send({ err: e })
  }
})

module.exports = router;
