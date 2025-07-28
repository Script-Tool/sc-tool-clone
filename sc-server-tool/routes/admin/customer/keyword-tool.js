const express = require('express');
var router = express.Router();

router.get('/delete-keyword/:id', async function (req, res) {
  let id = req.params.id
  if (id) {
    const HotKeyword = getModel('HotKeyword')

    await HotKeyword.deleteOne({ _id: id })

    return res.json({ success: true })
  }
  return res.json({ success: false })
})

router.get('/delete-topic/:id', async function (req, res) {
  let id = req.params.id
  if (id) {
    const Topic = getModel('Topic')
    const HotKeyword = getModel('HotKeyword')

    try {
      let topic = await Topic.findOne({ _id: id })
      if (topic) {
        await topic.remove()
        await HotKeyword.deleteMany({ topic_code: topic.code })
      }
      
    } catch (error) {
      console.log(error);
    }

    return res.json({ success: true })
  }
  return res.json({ success: false })
})

router.get('/add-topic', async function (req, res) {
  let data = req.query
  if (data) {
    const Topic = getModel('Topic')

    await Topic.create(data)

    return res.json({ success: true })
  }
  return res.json({ success: false })
})

router.get('/add-keyword', async function (req, res) {
  let data = req.query
  const HotKeyword = getModel('HotKeyword')

  if (data && data.keyword) {
    let keywords = [data]

    if (data.keyword.indexOf(',') > -1) {
      keywords = []
      data.keyword.split(',').map(key => {
        if (key) {
          keywords.push({
            keyword: key.trim(),
            topic_code: data.topic_code
          })
        }
      })
    }

    for await (let item of keywords) {
      await HotKeyword.create(item)
    }

    return res.json({ success: true })
  }
  return res.json({ success: false })
})

module.exports = express.Router().use(router)
