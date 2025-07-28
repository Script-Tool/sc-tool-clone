var express = require('express')
var router = express.Router();
const viewsRoute = require('./views')
const customerRoute = require('./customers')
const servicePackRoute = require('./service_package')
const chatRoute = require('./chat')
const orderRoute = require('./order')
const keywordToolRoute = require('./keyword-tool')

router.use('/keyword-tool', keywordToolRoute)
router.use('/order', orderRoute)
router.use('/chat', chatRoute)
router.use('/view', viewsRoute)
router.use('/service-package', servicePackRoute)
router.use('/customer', customerRoute)

module.exports = router;
