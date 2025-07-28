var express = require('express');
var router = express.Router();
const scriptRoute = require('./script');
const profileRoute = require('./profile');
const proxyRoute = require('./proxy');
const configRoute = require('./config');
const phoneNumberRoute = require('./phone-number');
const vmRoute = require('./vm');
const accountRoute = require('./account');
const dataRoute = require('./data');
const playlistRoute = require('./playlist');
const mediaRoute = require('./media');
const gptScriptRoute = require('./ai-script');
const apikey = require('./api-key');

router.use('/ai-script', gptScriptRoute);
router.use('/media', mediaRoute);
router.use('/script', scriptRoute);
router.use('/profile', profileRoute);
router.use('/proxy', proxyRoute);
router.use('/config', configRoute);
router.use('/phone', phoneNumberRoute);
router.use('/vm', vmRoute);
router.use('/account', accountRoute);
router.use('/data', dataRoute);
router.use('/playlist', playlistRoute);
router.use('/api-key', apikey);

module.exports = router;
