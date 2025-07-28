const express = require('express');
const { default: axios } = require('axios');

const router = express.Router();

const oam_model = require('../../model/oam_model');
const rootApiRequest = require('../../modules/root-api-request');
const { formatScriptLogs } = require('../../src/utils/formatScriptLogs');

router.get('/reupdate-scan-mail', async function (req, res, next) {
    let updated = 0;
    let profiles = await getModel('Profile').find({
        description: 'scan_reco_mail_success',
    });
    for await (let p of profiles) {
        if (p.reco_mails && p.reco_mails.length) {
            let reco = p.reco_mails[0];
            if (reco) {
                updated++;
                await p.updateOne({ recover_mail: reco });
            }
        }
    }

    res.json({ updated, profiles: profiles.length });
});

router.get('/cli-for-check-dup', async function (req, res, next) {
    let rs = await getModel('Service').aggregate([
        { $group: { _id: '$data', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
        { $project: { data: '$_id', _id: 0 } },
    ]);

    let logs = [];
    for await (let da of rs) {
        let fsv = await getModel('Service').findOne({
            data: da.data,
            script_code: 'youtube_sub',
            is_stop: false,
        });

        if (fsv) {
            let svData = JSON.parse(fsv.data);
            logs.push(svData.channel_id);
            await getModel('Service').updateMany(
                {
                    data: { $regex: `"channel_id":"${svData.channel_id}"` },
                    script_code: 'youtube_sub',
                    id: { $ne: fsv.id },
                },
                { is_stop: true },
            );
        }
    }

    res.json({ logs, count: logs.length });
});

router.get('/count-verify', async function (req, res, next) {
    let rs = await getModel('Profile').find({ verified: true }).countDocuments();
    res.json({ count: rs });
});

router.get('/count-used_for_recovery', async function (req, res, next) {
    let rs = await getModel('Profile').find({ used_for_recovery: true }).countDocuments();
    res.json({ count: rs });
});

router.get('/reset-veri', async function (req, res, next) {
    let rs = await getModel('Profile').updateMany({}, { verified: false, used_for_recovery: false });
    res.json({ success: true, rs });
});

router.get('/countProfiles', async function (req, res, next) {
    let filter = {};
    Object.keys(req.query).forEach((i) => {
        if (['verified', 'used_for_recovery'].includes(i)) {
            if (i == 'true') {
                filter[i] = true;
            } else {
                filter[i] = false;
            }
        } else {
            filter[i] = req.query[i];
        }
    });
    let count = await getModel('Profile').find(filter).countDocuments();
    res.json({ success: true, count });
});

router.get('/reset_wait_code', async function (req, res, next) {
    wait_code = {};
    res.json({ success: true });
});

router.get('/reset_ready_recovery_mail', async function (req, res, next) {
    ready_recovery_mail = [];
    res.json({ success: true });
});

router.get('/test', async function (req, res, next) {
    res.json({ scriptsReady });
});

router.get('/test2', async function (req, res, next) {
    res.json({ wait_code, ready_recovery_mail });
});

router.get('/checkOrder', async function (req, res, next) {
    try {
        const OrderModel = getModel('Order');
        let orderRunning = await OrderModel.find({
            status: 'running',
            'package.type': 'run_service',
        });
        for await (let order of orderRunning) {
            let rs = await rootApiRequest.request({
                url: '/service/' + order.order_result,
                method: 'GET',
            });

            if (rs.data.success && rs.data.service.remaining == 0) {
                // check value before complete
                if (order.fisrt_value_log) {
                    let currentValue = '';
                    let totalTarget = Number(order.fisrt_value_log) + order.package.value;
                    if (order.package.script_code == 'youtube_sub') {
                        try {
                            currentValue = await OrderModel.getCurrentValue(
                                order.package.script_code,
                                order.customer_values,
                            );
                        } catch (error) {
                            console.log(error);
                            continue;
                        }
                    }
                    if (Number(currentValue) && currentValue < totalTarget) {
                        currentValue = Number(currentValue);

                        // call to server tool add more value
                        let additional_value = totalTarget - currentValue;
                        additional_value += (additional_value * 15) / 100;
                        additional_value = Math.floor(additional_value);
                        if (additional_value) {
                            await rootApiRequest.request({
                                url: '/service/additional',
                                method: 'POST',
                                data: {
                                    service_id: order.order_result,
                                    additional_value,
                                },
                            });
                            continue;
                        }
                    }
                }

                await order.updateOne({ status: 'complete' });
            }
        }
    } catch (error) {
        console.log(error);
    }
    return res.json({ success: true });
});

router.get('/cli', async function (req, res, next) {
    let Service = getModel('Service');
    let services = await Service.find({
        script_code: 'youtube_sub',
        remaining: { $ne: -1 },
        id: { $lt: 524627 },
    });

    let total = 0;
    const percentRefund = 35;
    let countUpdated = 0;
    for await (let sv of services) {
        let totalSub = sv.remaining + sv.executed;
        if (Number(totalSub) && totalSub > 25) {
            totalSub = Math.floor((totalSub * percentRefund) / 100);

            if (req.query.updateID == 'kimtrong') {
                await sv.updateOne({ $inc: { remaining: totalSub } });
            }

            countUpdated++;
            total += totalSub;
        }
    }

    res.json({ total, countUpdated });
});

router.post('/check-vps', async function (req, res, next) {
    const ConfigModel = getModel('Config');
    let vpsIPs = req.body.vps_ips;
    vpsIPs = vpsIPs.trim();
    vpsIPs = vpsIPs.split('\n');
    vpsIPs = vpsIPs.map((ip) => {
        ip = ip.replace(',', '');
        return ip.trim();
    });

    let data = await ConfigModel.findOne({ key: 'current_vps' });
    if (data) {
        await data.updateOne({ data: vpsIPs });
    } else {
        await ConfigModel.create({ data: vpsIPs, key: 'current_vps' });
    }

    let liveVps = [];
    let errorVps = [];
    vpsIPs.forEach((ip) => {
        if (vmRunnings.some((vm) => vm.IP == ip)) {
            liveVps.push(ip);
        } else {
            errorVps.push(ip);
        }
    });

    return res.json({ liveVps, errorVps });
});

router.get('/debug/vm-running', async function (req, res, next) {
    res.send(vmRunnings);
});

router.get('/get-vm-logs', async function (req, res, next) {
    let vms = {};
    vmRunnings.forEach((vm) => {
        if (!vms[vm.vm_name]) {
            vms[vm.vm_name] = {
                totalPids: vm.pids.length,
                totalVps: 1,
            };
        } else {
            vms[vm.vm_name] = {
                totalPids: vms[vm.vm_name].totalPids + vm.pids.length,
                totalVps: vms[vm.vm_name].totalVps + 1,
            };
        }
    });

    res.send({ vms, updateVmFlag });
});

router.get('/get-bat-logs', async function (req, res, next) {
    res.send({ logs: statisBAT });
});

/**
 * Trả ra file views/oam/system-scripts.ejs
 */
router.get('/system-scripts', async function (req, res, next) {
    const Country = await getModel('Country');
    const countries = await Country.find({});
    const { data } = await axios('https://api.exchangerate-api.com/v4/latest/RUB');

    render(res, 'oam/system-scripts', {
        title: 'System scripts',
        config: {
            ...youtube_config,
            max_price: (youtube_config.max_price * data.rates.USD).toFixed(2),
        },
        phone_countries: countries,
    });
});

/**
 * Quản lý hiển thị danh sách trình duyệt
 * Trả ra file views/oam/browser-management.ejs
 */
router.get('/browser-management', async function (req, res, next) {
    render(res, 'oam/browser-management', {
        title: 'Browser Management',
    });
});

router.get('/get-view-logs', async function (req, res, next) {
    let viewLogs = statisView;
    let isFB = youtube_config.is_fb ? true : false;

    res.send({
        isFB,
        logs: [
            ...viewLogs,
            {
                h: '--',
                countView,
                countAds,
                countPlayListViews,
            },
        ],
    });
});

router.get('/get-profile-logs', async function (req, res, next) {
    const youtubeProfiles = await getModel('YoutubeProfile').find();

    res.json({
        logs: youtubeProfiles.map((yp) => ({
            profile_email: yp.profile_email,
            ...yp.metrics,
        })),
    });
});

router.get('/dashboard', async function (req, res, next) {
    let info = await oam_model.getSystemInfo();

    let total_updated = 0;
    let is_updated_all = vmRunnings.every((vm) => {
        if (vm.updated) {
            total_updated++;
            return true;
        }
        return false;
    });

    const data = await getModel('Config').findOne({ key: 'current_vps' });
    let vps_ips = [];
    if (data && Array.isArray(data.data)) {
        vps_ips = data.data;
    }

    let scriptLogs = await getModel('Script').find(
        {
            $or: [{ logs: { $exists: true } }, { logsSubMissing: { $exists: true } }],
        },
        'logs code logsSubMissing',
    );

    scriptLogs.forEach((scriptLog) => {
        let tempData = formatScriptLogs(scriptLog.logs);
        let tempDataSubMissing = formatScriptLogs(scriptLog.logsSubMissing);
        scriptLog.logs = tempData;
        scriptLog.logsSubMissing = tempDataSubMissing;
    });

    let isFB = youtube_config.is_fb ? true : '';
    render(res, 'oam/index', {
        title: 'Dashboard',
        info,
        IP,
        PORT,
        is_updated_all,
        total_updated,
        vps_ips,
        scriptLogs,
        isFB: isFB,
        logBh,
    });
});

router.get('/playlist', async function (req, res) {
    try {
        let Playlist = getModel('Playlist');
        let playlists = await Playlist.find();

        let vmNames = [];
        vmRunnings.forEach((vm) => {
            vmNames.push(vm.vm_name);
        });
        vmNames = [...new Set(vmNames)];

        let info = {
            playlist: await getModel('Playlist').find().countDocuments(),
            jct_playlist: await getModel('PlaylistJCT').find().countDocuments(),
        };

        render(res, 'oam/playlist', {
            title: 'Playlist',
            playlists: playlists,
            vmNames,
            info,
        });
    } catch (e) {
        console.log('error', 'get-playlist-info err: ', e);
        res.send({ err: e });
    }
});

async function getScriptsData(script_type) {
    const ScriptModel = getModel('Script');
    const Service = getModel('Service');

    // Truy vấn các script theo script_type và sắp xếp theo vị trí
    const scripts = await ScriptModel.find({
        script_type: { $in: [script_type] },
    }).sort('position');

    // Sử dụng Promise.all để xử lý song song các script
    await Promise.all(
        scripts.map(async (script) => {
            let services = [];
            let isInfinity = false;

            // Chỉ lấy các service có script_code tương ứng và không có status là 'stop'
            if (script.code === 'add_video_playlist' || script.code === 'create_playlist') {
                isInfinity = true;
            } else {
                services = await Service.find({
                    script_code: script.code,
                    is_stop: { $ne: true },
                });
            }

            // Tính tổng số lượng remaining
            const totalRemaining = services.reduce((total, item) => {
                if (item.remaining === -1) {
                    isInfinity = true;
                    return total;
                }
                return total + Number(item.remaining);
            }, 0);

            // Cập nhật thuộc tính remaining cho script
            script.remaining = (isInfinity ? '∞ - ' : '') + totalRemaining;
        }),
    );

    return scripts;
}

router.get('/scripts', async function (req, res) {
    try {
        let script_type = req.query.script_type;
        let scripts = await getScriptsData(script_type);

        render(res, 'oam/script', {
            title: 'Scripts',
            scripts,
            manage: false,
            script_type,
        });
    } catch (e) {
        console.log('error', 'get-playlist-info err: ', e);
        res.send({ err: e });
    }
});

router.get('/manage-scripts', async function (req, res) {
    try {
        // let scripts = await getScriptsData();
        let script_type = req.query.script_type;
        let scripts = await getScriptsData(script_type);

        render(res, 'oam/script', {
            title: 'Scripts',
            scripts,
            manage: true,
            script_type,
        });
    } catch (e) {
        console.log('error', 'get-playlist-info err: ', e);
        res.send({ err: e });
    }
});

router.get('/profile', async function (req, res, next) {
    try {
        let ProfileModel = getModel('Profile');
        let info = await oam_model.getProfileInfo();
        let filter = ProfileModel.getQuery(req);

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let countTotal = await ProfileModel.find().countDocuments();
        let countTiktok = await ProfileModel.find({
            type: 'TIKTOK',
        }).countDocuments();

        let countFB = await ProfileModel.find({
            type: 'FACEBOOK',
        }).countDocuments();
        let countYoutube = countTotal - (countTiktok + countFB);

        let profiles = await ProfileModel.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await ProfileModel.find(filter).countDocuments();

        profiles.forEach((p) => {
            if (p.last_time_reset) {
                let d = new Date(p.last_time_reset);
                let t = Date.now() - d.getTime();
                p.logout_time = (t / 3600000).toFixed(1);
            }
        });

        render(res, 'oam/profile', {
            title: 'PROFILES',
            info: info,
            profiles,
            count,
            current_page,
            renew_for_suspend: youtube_config.renew_for_suspend,
            countTiktok,
            countFB,
            countYoutube,
        });
    } catch (error) {
        console.log('Error while get profiles', error);
    }
});

router.get('/profile/:email', async function (req, res, next) {
    try {
        const userEmail = req.params.email;
        const ProfileModel = getModel('Profile');

        // Find profile by email
        const profile = await ProfileModel.findOne({ email: userEmail });

        // Handle case when profile is not found
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found with this email',
            });
        }

        render(res, 'oam/youtube_content', {
            title: 'PROFILES',
            profile,
        });
    } catch (error) {
        console.error('Error finding profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error finding profile',
            error: error.message,
        });
    }
});

router.get('/proxy', async function (req, res, next) {
    let Proxy = getModel('Proxy');
    let proxyTotal = await Proxy.find({}).countDocuments();
    let usedTotal = await Proxy.find({ used: true }).countDocuments();
    let proxyUnactive = proxyTotal - usedTotal;
    let proxies = await Proxy.find().limit(10);
    render(res, 'oam/proxy', {
        title: 'Proxy',
        proxies,
        info: { proxyUnactive, proxyTotal, usedTotal },
        auto_renew_proxy: youtube_config.auto_renew_proxy,
    });
});

/**
 * Trang quản lý danh sách service
 */
router.get('/script', async function (req, res) {
    try {
        let code = req.query.code;
        let Service = getModel('Service');
        let Script = getModel('Script');
        let Log = getModel('Log');
        let rs = await Script.findOne({ code });
        let example_data = rs.example_data;
        let default_service_data = rs.default_service_data || {};
        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 10;
        const config = youtube_config;

        let filter = Service.getFilter(req);

        let services = await Service.find(filter)
            .sort({ id: -1 })
            .skip((current_page - 1) * per_page)
            .limit(per_page);

        let count = await Service.find(filter).countDocuments();
        const logs = await Log.find({ script_code: code }).sort({ createdAt: -1 });

        render(res, 'oam/script_manage', {
            title: 'Script manage',
            code,
            services,
            example_data,
            count,
            per_page,
            current_page,
            default_service_data: default_service_data,
            logs,
            config,
        });
    } catch (e) {
        console.log('error', 'get-playlist-info err: ', e);
        res.send({ err: e });
    }
});

router.get('/comments', async function (req, res, next) {
    try {
        let Model = getModel('Comment');
        let filter = {};

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        if (req.query.target) {
            filter.target = req.query.target;
        }

        let comments = await Model.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page)
            .sort({ createdAt: -1 });
        let count = await Model.find(filter).countDocuments();

        render(res, 'oam/comment', {
            title: 'Comments',
            comments,
            count,
            current_page,
        });
    } catch (error) {
        console.log('Error while get comments');
    }
});

router.get('/configs', async function (req, res, next) {
    try {
        let config = youtube_config;
        if (!config) {
            config = {};
        }

        let traceExs = [
            'mac_refresh_1_gpu_old',
            'mac_refresh_99999_gpu_new',
            'mac10_13',
            'mac10_14_6',
            'win_7',
            'win_8',
            'win_8_1',
            'win_10',
            'win_chrome_refresh_1_gpu_old',
            'win_edg_gpu_new',
            'win_refresh_99999_gpu_new',
            'win_10_chrome',
            'win_10_edge',
            'win_10_opera',
            'level_minimum',
            'level_standard',
            'level_high',
            'level_extreme',
            'iphone',
            'trace_test',
        ];
        traceExs = traceExs.map((name) => {
            return {
                name: name,
                active: youtube_config.trace_names_ex && youtube_config.trace_names_ex.includes(name),
            };
        });

        let browsers = [
            { code: 'chromium-browser', name: 'Chromium' },
            { code: 'brave', name: 'Brave' },
            { code: 'opera', name: 'Opera' },
            { code: 'microsoft-edge', name: 'Edge' },
            { code: 'google-chrome-stable', name: 'Chrome' },
            { code: 'vivaldi-stable', name: 'Vivaldi' },
            { code: 'iridium-browser', name: 'Iridium (Chỉ chạy trên centos)' },
            { code: 'avast', name: 'Avast (Chỉ chạy trên window)' },
        ];

        render(res, 'oam/config', {
            title: 'Config',
            config,
            traceExs,
            browsers,
            IP,
            PORT,
            setup_key: youtube_config.update_key,
        });
    } catch (error) {
        console.log(error);
    }
});

router.get('/proxy-v4', async function (req, res, next) {
    try {
        let proxies = [];
        const ProxyV4 = getModel('ProxyV4');
        proxies = await ProxyV4.find();
        proxies.forEach((element) => {
            let proxy = proxiesV4.find((i) => i.api_id == element._id);
            if (proxy) {
                element.current_proxy = proxy.server;
                element.timeout = proxy.timeout;
            }
        });
        render(res, 'oam/proxy_v4_api', {
            title: 'Proxy V4 API',
            proxies: proxies,
        });
    } catch (error) {
        console.log('Error while get proxies', error);
    }
});

router.get('/accounts', async function (req, res, next) {
    try {
        let Account = getModel('Account');
        let info = {}; //await oam_model.getProfileInfo()
        let filter = {};

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        if (req.query.type) {
            filter.type = req.query.type;
        }

        if (req.query.createdTime) {
            filter['createdAt'] = {
                $lt: new Date(Date.now() - 1000 * 60 * Number(req.query.createdTime)),
            };
        }

        let accounts = await Account.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await Account.find(filter).countDocuments();

        render(res, 'oam/accounts', {
            title: 'ACCOUNTS',
            info: info,
            accounts,
            count,
            current_page,
        });
    } catch (error) {
        console.log('Error while get accounts');
    }
});

router.get('/keys', async function (req, res, next) {
    try {
        let KeyModel = getModel('Key');
        let filter = {};

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let keys = await KeyModel.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page)
            .sort({ createdAt: -1 });
        let count = await KeyModel.find(filter).countDocuments();

        keys.forEach((key) => {
            let timeLive = key.time - Date.now();
            if (timeLive > 0) {
                key.time = Math.floor(timeLive / (1000 * 60 * 60 * 24));
            } else {
                key.time = 0;
            }
        });
        render(res, 'oam/key', { title: 'API keys', keys, count, current_page });
    } catch (error) {
        console.log('Error while get keys');
    }
});

// router để hiển thị jct_playlist
router.get('/jct_playlist', async function (req, res, next) {
    try {
        let PlaylistJCT = getModel('PlaylistJCT');
        // đổi type total_view, total_video sang number
        await PlaylistJCT.updateMany(
            {
                $or: [
                    // Điều kiện: tìm các bản ghi có total_video hoặc total_view là chuỗi
                    { total_video: { $type: 'string' } },
                    { total_view: { $type: 'string' } },
                ],
            },
            [
                {
                    $set: {
                        total_video: { $toInt: '$total_video' }, // Chuyển đổi total_video sang số
                        total_view: { $toInt: '$total_view' }, // Chuyển đổi total_view sang số
                    },
                },
            ],
        );

        let filter = {};
        if (req.query.tag) {
            filter.tag = { $regex: req.query.tag };
        }

        if (req.query.countVideo) {
            if (req.query.typeCountVideo == '=') {
                filter.total_video = req.query.countVideo;
            } else {
                filter.total_video = {
                    [req.query.typeCountVideo]: Number(req.query.countVideo),
                };
            }
        }

        if (req.query.countView) {
            if (req.query.typeCountView == '=') {
                filter.total_view = req.query.countView;
            } else {
                filter.total_view = {
                    [req.query.typeCountView]: Number(req.query.countView),
                };
            }
        }

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 100;

        let rows = await PlaylistJCT.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page)
            .sort({ createdAt: -1 });
        let count = await PlaylistJCT.find(filter).countDocuments();

        let tags = await PlaylistJCT.aggregate([{ $group: { _id: '$tag', count: { $sum: 1 } } }]);

        render(res, 'oam/jct_playlist', {
            title: 'JCT Playlist',
            rows,
            count,
            current_page,
            tags,
        });
    } catch (error) {
        console.log(error);
        console.log('Error while get PlaylistJCT');
    }
});

// danh sách ảnh
router.get('/image-list', async function (req, res) {
    try {
        const Image = getModel('Image');
        const images = await Image.find();
        const role = 'super_admin';
        res.render('oam/image-list', {
            images: images,
            title: 'Image',
            server_name: 'Server Tool',
            role: role,
        });
    } catch (e) {
        console.log('error', e);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/api_key', async function (req, res, next) {
    try {
        let APIKey = getModel('APIKey');
        let filter = {};

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let rows = await APIKey.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page)
            .sort({ _id: -1 });
        let count = await APIKey.find(filter).countDocuments();

        render(res, 'oam/api_key', { title: 'API Key', rows, count, current_page });
    } catch (error) {
        console.log('Error while get Api key');
    }
});

router.get('/partner-api-docs', async function (req, res, next) {
    render(res, 'oam/partner-api-docs', { title: 'Partner API Docs' });
});

router.get('/fb_group_sets', async function (req, res, next) {
    try {
        let FBGroupSet = getModel('FBGroupSet');
        let filter = {};

        if (req.query.name) {
            filter.name = { $regex: req.query.name };
        }

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let rows = await FBGroupSet.find(filter)
            .lean()
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await FBGroupSet.find(filter).countDocuments();

        for (let row of rows) {
            let countGroup = await getModel('FBGroup').find({ set_id: row._id }).countDocuments();
            let countContent = await getModel('FBContent').find({ set_id: row._id }).countDocuments();
            let countProfile = await getModel('FBProfile').find({ set_id: row._id }).countDocuments();
            let countPages = await getModel('FBPage').find({ set_id: row._id }).countDocuments();
            row.total_group = countGroup;
            row.total_content = countContent;
            row.total_profile = countProfile;
            row.total_page = countPages;
        }

        render(res, 'oam/fb_group_sets', {
            title: 'FB Group Topic',
            rows,
            count,
            current_page,
        });
    } catch (error) {
        console.log('Error while get FB Groups', error);
    }
});

router.get('/fb_groups', async function (req, res, next) {
    try {
        let FBGroup = getModel('FBGroup');
        let filter = {};

        if (req.query.set_id) {
            filter.set_id = req.query.set_id;
        }
        if (req.query.status) {
            filter.status = req.query.status == 'false' ? false : true;
        }

        if (req.query.link) {
            filter.link = req.query.link;
        }

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let rows = await FBGroup.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await FBGroup.find(filter).countDocuments();

        render(res, 'oam/fb_groups', {
            title: 'FB Groups',
            rows,
            count,
            current_page,
            set_id: req.query.set_id,
        });
    } catch (error) {
        console.log('Error while get FB Groups');
    }
});

router.get('/fb_pages', async function (req, res, next) {
    try {
        let Model = getModel('FBPage');
        let filter = {};

        if (req.query.set_id) {
            filter.set_id = req.query.set_id;
        }
        if (req.query.status) {
            filter.status = req.query.status == 'false' ? false : true;
        }

        if (req.query.link) {
            filter.link = req.query.link;
        }

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let rows = await Model.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await Model.find(filter).countDocuments();

        render(res, 'oam/fb_pages', {
            title: 'FB Pages',
            rows,
            count,
            current_page,
            set_id: req.query.set_id,
        });
    } catch (error) {
        console.log('Error while get FB pages');
    }
});

router.get('/fb_profiles', async function (req, res, next) {
    try {
        let FBProfile = getModel('FBProfile');
        let filter = {};

        if (req.query.set_id) {
            filter.set_id = req.query.set_id;
        }
        if (req.query.status) {
            filter.status = req.query.status == 'false' ? false : true;
        }

        if (req.query.fb_id) {
            filter.fb_id = req.query.fb_id;
        }

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let rows = await FBProfile.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await FBProfile.find(filter).countDocuments();

        render(res, 'oam/fb_profiles', {
            title: 'FB Profiles',
            rows,
            count,
            current_page,
            set_id: req.query.set_id,
        });
    } catch (error) {
        console.log('Error while get FB Profiles');
    }
});

router.get('/fb_contents', async function (req, res, next) {
    try {
        let FBContent = getModel('FBContent');
        let filter = {};

        if (req.query.set_id) {
            filter.set_id = req.query.set_id;
        }

        if (req.query.content) {
            filter.content = { $regex: req.query.content };
        }

        let current_page = req.query.current_page || 1;
        let per_page = req.query.per_page || 50;

        let rows = await FBContent.find(filter)
            .skip((current_page - 1) * per_page)
            .limit(per_page);
        let count = await FBContent.find(filter).countDocuments();

        render(res, 'oam/fb_contents', {
            title: 'FB Contents',
            rows,
            count,
            current_page,
            set_id: req.query.set_id,
        });
    } catch (error) {
        console.log('Error while get FB Groups');
    }
});

router.get('/script-creation', async function (req, res, next) {
    try {
        render(res, 'oam/script_creation.ejs', { title: 'Script creation' });
    } catch (error) {
        console.log('adfdg');
    }
});

function render(res, path, params) {
    params.role = res.role;
    res.render(path, params);
}

router.get('/analytics', async function (req, res, next) {
    try {
        const ServiceModel = getModel('Service');
        const script_code = req.query.script_code || 'youtube_sub';

        const services = await ServiceModel.find({ script_code: 'youtube_sub' });

        // Tính tổng theo ngày
        const dailyTotals = {};
        let total_refund = 0;
        let total_remaining = 0;
        services.forEach((service) => {
            total_refund += service.partial_refund || 0;
            total_remaining += service.fisrt_remaining || 0;
            const date = service.createdAt.toISOString().split('T')[0];
            if (!dailyTotals[date]) {
                dailyTotals[date] = { fisrt_remaining: 0, partial_refund: 0, total: 0 };
            }
            dailyTotals[date].fisrt_remaining += service.fisrt_remaining || 0; // Xử lý trường hợp first_remaining là null
            dailyTotals[date].partial_refund += service.partial_refund || 0; // Xử lý trường hợp partial_refund là null
            dailyTotals[date].total += 1;
        });

        // Chuyển đổi thành mảng để dễ dàng hiển thị
        const dailyTotalsArray = Object.entries(dailyTotals).map(([date, totals]) => ({
            date,
            ...totals,
        }));

        render(res, 'oam/analytics', {
            title: 'Analytics',
            dailyTotals: dailyTotalsArray,
        });
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Thêm route để hiển thị trang logs
router.get('/logs', async function (req, res, next) {
    try {
        const LogModel = getModel('Log');
        const filter = {};
        const query = {};
        const queryString = [];

        // Xử lý các tham số truy vấn
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.per_page) || 20;

        // Lọc theo script_code
        if (req.query.script_code) {
            filter.script_code = { $regex: req.query.script_code, $options: 'i' };
            query.script_code = req.query.script_code;
            queryString.push(`script_code=${req.query.script_code}`);
        }

        // Lọc theo nội dung
        if (req.query.message) {
            filter.message = { $regex: req.query.message, $options: 'i' };
            query.message = req.query.message;
            queryString.push(`message=${req.query.message}`);
        }

        // Lọc theo khoảng thời gian
        if (req.query.startDate) {
            const startDate = new Date(req.query.startDate);
            startDate.setHours(0, 0, 0, 0);

            if (!filter.createdAt) filter.createdAt = {};
            filter.createdAt.$gte = startDate;

            query.startDate = req.query.startDate;
            queryString.push(`startDate=${req.query.startDate}`);
        }

        if (req.query.endDate) {
            const endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 999);

            if (!filter.createdAt) filter.createdAt = {};
            filter.createdAt.$lte = endDate;

            query.endDate = req.query.endDate;
            queryString.push(`endDate=${req.query.endDate}`);
        }

        // Đếm tổng số lượng log phù hợp với bộ lọc
        const totalItems = await LogModel.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / perPage);

        // Tính toán phạm vi phân trang
        let paginationStart = Math.max(1, page - 2);
        let paginationEnd = Math.min(totalPages, page + 2);

        // Đảm bảo luôn hiển thị 5 trang nếu có thể
        if (paginationEnd - paginationStart + 1 < 5 && totalPages > 5) {
            if (paginationStart === 1) {
                paginationEnd = Math.min(5, totalPages);
            } else if (paginationEnd === totalPages) {
                paginationStart = Math.max(1, totalPages - 4);
            }
        }

        // Lấy danh sách log với phân trang
        const logs = await LogModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const queryStringText = queryString.length > 0 ? '&' + queryString.join('&') : '';

        // Render trang logs
        render(res, 'oam/logs', {
            title: 'Quản lý Log',
            logs,
            current_page: page,
            per_page: perPage,
            total_items: totalItems,
            total_pages: totalPages,
            pagination_start: paginationStart,
            pagination_end: paginationEnd,
            query,
            query_string: queryStringText,
            formatDateTimeForInput,
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách log:', error);
        res.status(500).send('Lỗi máy chủ nội bộ');
    }
});

function formatDateTimeForInput(date) {
    if (!date) return '';

    // Chuyển đổi thành đối tượng Date
    const scheduledDate = date instanceof Date ? date : new Date(date);

    // Thêm 7 giờ cho múi giờ Việt Nam
    const vietnamTime = new Date(scheduledDate.getTime() + 7 * 60 * 60 * 1000);

    // Định dạng ngày tháng theo MM/DD/YYYY, HH:MM
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const year = vietnamTime.getUTCFullYear();
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0');

    return `${month}/${day}/${year}, ${hours}:${minutes}`;
}
module.exports = router;
