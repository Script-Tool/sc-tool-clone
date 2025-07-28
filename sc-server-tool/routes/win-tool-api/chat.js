const express = require('express');
var router = express.Router();

router.get('/', async function(req, res) {
  try {
    const ChatModel = getModel('Chat')
    let customer = req.customer
    let chats = await ChatModel.find({ customer: customer.id })

    return res.json({ success: true, chats })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

router.post('/', async function(req, res) {
  try {
    const ChatModel = getModel('Chat')
    let customer = req.customer
    let { message } = req.body

    // check
    if (message.length <= 255) {
      await ChatModel.create({ message, customer: customer.id })
      return res.json({ success: true })
    }

    return res.json({ success: false })
  } catch (error) {
    console.log(error);
    return res.json({ success: false })
  }
})

module.exports = router;
