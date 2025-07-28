var express = require('express');
var router = express.Router();
const proxyRoute = require('./proxy');
const viewAdmin = require('./view');
const scriptRoute = require('./script');
const crawlRoute = require('./crawl');
const commentRoute = require('./comment');
const serviceRoute = require('./service');
const configRoute = require('./config');
const profileRoute = require('./profile');
const proxyV4Route = require('./proxy-v4');
const playlistRoute = require('./playlist');
const keyRoute = require('./key');
const playlistJCTRoute = require('./jct_playlist');
const adminCustomerRoute = require('./customer');
const apiKeyRoute = require('./api_key');
const accountRoute = require('./account');
const fbGroupSetRoute = require('./fb_group_set');
const fbGroupRoute = require('./fb_group');
const fbContentRoute = require('./fb_content');
const fbProfile = require('./fb_profile');
const cliRoute = require('./cli');
const fbPageRoute = require('./fb_page');
const media = require('./media');
const channelRoutes = require('./channel');
const browsers = require('./browsers');

const analytics = require('./analytics');
const logsRoute = require('./logs'); // Thêm route mới

router.use('/fb_page', fbPageRoute);
router.use('/cli', cliRoute);
router.use('/fb_content', fbContentRoute);
router.use('/fb_group', fbGroupRoute);
router.use('/fb_group_set', fbGroupSetRoute);
router.use('/account', accountRoute);
router.use('/api-key', apiKeyRoute);
router.use('/customer', adminCustomerRoute);
router.use('/config', configRoute);
router.use('/crawl', crawlRoute);
router.use('/script', scriptRoute);
router.use('/service', serviceRoute);
router.use('/proxy', proxyRoute);
router.use('/comment', commentRoute);
router.use('/view', viewAdmin);
router.use('/profile', profileRoute);
router.use('/proxy-v4', proxyV4Route);
router.use('/playlist', playlistRoute);
router.use('/key', keyRoute);
router.use('/jct_playlist', playlistJCTRoute);
router.use('/fb_profile', fbProfile);
router.use('/media', media);
router.use('/channels', channelRoutes);
router.use('/browsers', browsers);

router.use('/analytics', analytics);
router.use('/logs', logsRoute); // Đăng ký route mới

module.exports = router;
