var express = require('express')
var router = express.Router();
const serviceRoute = require('./service')
const playlistRoute = require('./playlist')
const scriptRoute = require('./script')
const helperRoute = require('./helper')
const commentRoute = require('./comment')
const imageRoute = require('./image')
const profileRoute = require('./profile')
const proxyRoute = require('./proxy')
const contentRoute = require('./content')

router.use('/playlist', playlistRoute)
router.use('/service', serviceRoute)
router.use('/script', scriptRoute)
router.use('/helper', helperRoute)
router.use('/comment', commentRoute)
router.use('/image', imageRoute)
router.use('/profile', profileRoute)
router.use('/proxy', proxyRoute)
router.use('/content', contentRoute)

module.exports = router;
