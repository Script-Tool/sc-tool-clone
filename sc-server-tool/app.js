// Require các module cần thiết
var express = require('express');
var app = express();

let paths = __dirname.split('/');
let rootFolderName = paths[paths.length - 1];
global.rootFolderName = rootFolderName;

var createError = require('http-errors');
const fs = require('fs');
const cors = require('cors');
const md5 = require('md5');
const cron = require('cron');
require('log-timestamp');
var path = require('path');
var cookieParser = require('cookie-parser');
const MonitorMethods = require('./src/monitor');
const { startCronJob, youtubeStatsJob } = require('./src/cron/youtubeCheck');
// Định nghĩa các biến toàn cầu
global.ready_profiles = [];
global.logBh = {};
global.proxies = [];
global.wait_code = {};
global.ready_recovery_mail = [];
global.pid_script_position = {};
global.ignoreProfiles = [];
global.updateVmFlag = [];
global.secret = 'UWOkH5IfunUSg95LresTyJyYr';
global.proxiesV4 = [];
global.removingProfiles = [];
global.rootDir = path.resolve(__dirname);
global.countView = 0;
global.countAds = 0;
global.countPlayListViews = 0;
global.statisView = [];
global.statisBAT = [];
global.vmRunnings = [];
global.scriptsReady = {};
global.flagForUpdateTool = false;
global.flagForResetProfiles = false;
global.youtube_config = {};
global.active_devices = [];
global.playlistSub = [];
global.groupDevices = [
    [
        { id: 'ip_se', label: 'ip_se', value: '1' },
        { id: 'ip_xr', label: 'ip_xr', value: '2' },
        { id: 'ip_12_pro', label: 'ip_12_pro', value: '3' },
        { id: 'pixel_5', label: 'pixel_5', value: '4' },
    ],
    [
        { id: 'samsung_s8', label: 'samsung_s8', value: '5' },
        { id: 'samsung_s20', label: 'samsung_s20', value: '6' },
        { id: 'ipad_air', label: 'ipad_air', value: '7' },
        { id: 'ipad_mini', label: 'ipad_mini', value: '8' },
    ],
    [
        { id: 'sur_pro', label: 'sur_pro', value: '9' },
        { id: 'sur_dou', label: 'sur_dou', value: '10' },
        { id: 'galaxy_fold', label: 'galaxy_fold', value: '11' },
        { id: 'samsung_a51_71', label: 'samsung_a51_71', value: '12' },
    ],
];

global.IP = '0.0.0.0';
/**
 * Sử dụng biến previousService này ở partner api
 * routes/partner-api/index.js
 */
global.previousService = 'topclick';
// Định nghĩa các route
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var channelRouter = require('./routes/channel');
var playlist = require('./routes/playlist');
var profile = require('./routes/profile');
var oam = require('./routes/oam');
var scriptRoute = require('./routes/script');

var apiRoute = require('./routes/api/index');
var adminRoutes = require('./routes/admin/index');
const partnerApiRoute = require('./routes/partner-api');
const partnerApiV2Route = require('./routes/partner-api-v2');
const toolServiceAPI = require('./routes/tool-service-api');
let fileRunRoute = require('./routes/file-run');
let authMiddleware = require('./routes/middleware/auth');
let apiMidd = require('./routes/middleware/api');
const mgDB = require('./db/index');
const initDefaultUsers = require('./src/utils/initDefaultUsers');
const initializeScripts = require('./src/utils/createOrUpdateScript');
const initializeCounters = require('./src/utils/initializeCounters');
const initSystemConfig = require('./src/utils/initSystemConfig');
const getIP = require('./src/utils/getIP');
const initDefaultBrowser = require('./src/utils/initDefaultBrowser');
const { initDirectLinkService } = require('./src/utils/initDirectLinkService');
const initApiKeys = require('./src/utils/initApiKeys');
const initDefaultCountries = require('./src/utils/initDefaultCountries');
const { aiCreateCron, createVideoCronJob } = require('./src/cron/aiCreateCron');
// const {
//   checkChangeVersionChromium,
// } = require("./src/cron/checkChangeVersionChromium");

global.getModel = mgDB;
app.use(cors());
initApp();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json({ limit: '50mb' })); // Giới hạn kích thước request body cho JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Giới hạn kích thước request body cho URL-encoded
app.use(cookieParser());
app.use(express.static('public'));
// Sử dụng các route
app.use('/', indexRouter);
app.use('/users', authMiddleware.userAuth, usersRouter);
app.use('/channel', authMiddleware.userAuth, channelRouter);
app.use('/playlist', authMiddleware.userAuth, playlist);
app.use('/profile', authMiddleware.userAuth, profile);
app.use('/oam', authMiddleware.userAuth, oam);
// app.use('/manage', viewRoutes);
app.use('/script', authMiddleware.userAuth, scriptRoute);
// Thiết lập thư mục "public" làm thư mục tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// app.use("/win-tool-manage-api", winToolManageApiRoute);
// app.use("/win-tool-api", apiMidd.checkWinToolApi, winToolApiRoute);
// api nối từ client
app.use('/tool-service-api', apiMidd.toolServiceAPIAuth, toolServiceAPI);
app.use('/partner-api-v2', apiMidd.checkPartnerApiV2, partnerApiV2Route);
app.use('/partner-api', apiMidd.checkPartnerApi, partnerApiRoute);
// app.use('/root-api', apiMidd.checkRootApi, rootApiRoute);
app.use('/api-alex', apiMidd.checkAPIKey, apiRoute);
app.use('/admin', authMiddleware.userAuth, adminRoutes);

app.use('/execute-file', apiMidd.link, fileRunRoute);
app.use(function (req, res, next) {
    next(createError(404));
});

// Hàm khởi tạo ứng dụng
async function initApp() {
    // load proxy cache
    getModel('Proxy').reloadGlobalProxy();
    MonitorMethods.loadScriptsReady();
    //init admin user
    await initDefaultUsers();
    await initSystemConfig();
    await initDefaultBrowser();
    await initDirectLinkService();
    await initApiKeys();
    await initDefaultCountries();
    let folders = ['file-run', 'logs'];
    for (let folderName of folders) {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }

    let ip = await getIP();

    IP = ip;
    secret = md5(ip + (process.env.PORT || rootFolderName));
    // khởi tạo dữ liệu script
    await initializeScripts();
    let ConfigModel = getModel('Config');
    let viewLogConfig = await ConfigModel.findOne({ key: 'view_logs' });
    if (viewLogConfig) {
        statisView = viewLogConfig.data.items;
    }
    let batLogConfig = await ConfigModel.findOne({ key: 'bat_logs' });
    if (batLogConfig) {
        statisBAT = batLogConfig.data.items;
    }
    // Khởi tạo bộ đếm ID cho các model
    await initializeCounters();
    // Khởi động các công việc (job) định kỳ
    job.start();
    checkProfileJob.start();
    loadReadyProfiles.start();
    jobCheckStatusScript.start();
    // jobCheckChangeVersionChromium.start();
    startCronJob();

    if (youtube_config.is_fb) {
        MonitorMethods.loadReadyProfiles();
    }
}

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.locals.server_name = process.env.PORT || 'Server';
app.locals.env = process.env;

// Theo dõi ứng dụng và tải các script sẵn sàng
setInterval(async function () {
    MonitorMethods.appMonitor();
    MonitorMethods.loadScriptsReady();
}, 60000);

// Công việc (job) kiểm tra profile
const checkProfileJob = new cron.CronJob({
    cronTime: '*/30 * * * *',
    onTick: function () {
        MonitorMethods.profileMonitor();
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh',
});
// Công việc (job) tải các profile sẵn sàng
const loadReadyProfiles = new cron.CronJob({
    cronTime: '* * * * *',
    onTick: function () {
        if (youtube_config.is_fb) {
            MonitorMethods.loadReadyProfiles();
        }
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh',
});
// Công việc (job) chính
const job = new cron.CronJob({
    cronTime: '59 * * * *',
    onTick: function () {
        // if (process.env.WIN_TOOL_SERVER) {
        //   MonitorMethods.processDataFromMainServer();
        // }
        if (process.env.SERVER_TYPE == 'customer') {
            MonitorMethods.checkOrderData();
        } else {
            // MonitorMethods.logBAT()
            MonitorMethods.logViewYoutube();
            //MonitorMethods.checkKeyMonitor()
            //MonitorMethods.checkSub()
        }
    },
    start: true,
    timeZone: 'Asia/Ho_Chi_Minh',
});
const jobCheckStatusScript = new cron.CronJob({
    cronTime: '*/10 * * * *',
    onTick: function () {
        MonitorMethods.checkStatusScript();
    },
    start: true,
});

// const jobCheckChangeVersionChromium = new cron.CronJob({
//   cronTime: "*/5 * * * *",
//   onTick: function () {
//     checkChangeVersionChromium();
//   },
//   start: true,
// });

youtubeStatsJob();
aiCreateCron();
// createVideoCronJob();

// ===================== END ======================

module.exports = app;
