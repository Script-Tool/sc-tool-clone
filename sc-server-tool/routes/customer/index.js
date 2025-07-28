var express = require('express')
var router = express.Router();
const helperRoute = require('./helper')
const authRoute = require('./auth')
const servicePackRoute = require('./service')
const orderRoute = require('./order')
const paymentRoute = require('./payment')
const keywordToolRoute = require('./keyword-tool')
const chatRoute = require('./chat')
const checkMailRoute = require('./check-mail')
const authMiddleware = require('../middleware/auth')

router.use('/keyword-tool', keywordToolRoute)
router.use(authMiddleware.customerAuth)

router.use('/check-mail', checkMailRoute)
router.use('/chat', chatRoute)
router.use('/payment', paymentRoute)
router.use('/order', orderRoute)
router.use('/helper', helperRoute)
router.use('/auth', authRoute)
router.use('/service', servicePackRoute)

module.exports = router;
