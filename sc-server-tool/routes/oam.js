const express = require('express');
const oam_model = require('../model/oam_model');
const proxy_model = require('../model/proxy_model');
const multer = require('multer');
const upload = multer({ dest: 'tmp/csv/' });
const csv = require('fast-csv');
const fs = require('fs');
const config = require('../config/config');
const path = require('path');

const router = express.Router();

// Route để khởi động lại tất cả các VPS
router.get('/restart-all-vps', async (req, res) => {
    try {
        vmRunnings.forEach((vm) => {
            vm.updated = false;
        });
        return res.send({ result: 'res ok' });
    } catch (e) {
        console.log('error', 'err: ', e);
        res.send({ err: e });
    }
});

// Route để hủy khởi động lại tất cả các VPS
router.get('/cancel-restart-all-vps', async (req, res) => {
    try {
        vmRunnings.forEach((vm) => {
            vm.updated = true;
        });
        return res.send({ result: 'res ok' });
    } catch (e) {
        console.log('error', 'err: ', e);
        res.send({ err: e });
    }
});

// Route để cập nhật cấu hình thiết bị
router.get('/set-config-devices', async (req, res) => {
    try {
        console.log('update-config devices:', req.query);
        const { activeDevices } = req.query;
        active_devices = Array.isArray(activeDevices) ? activeDevices : [];
        return res.send({ result: 'update config activeDevices ok' });
    } catch (e) {
        console.log('error', 'err: ', e);
        res.send({ err: e });
    }
});

// Route để lấy thông tin playlist
router.get('/playlist', async (req, res) => {
    try {
        const { filter } = req.query;
        const videos = await oam_model.getPlaylistInfo(filter);
        const config = youtube_config || {};
        const Playlist = await getModel('Playlist');
        const playlists = await Playlist.find({});
        res.render('oam/playlist', {
            title: 'VIEW INFO',
            playlists,
            config,
            videos,
        });
    } catch (e) {
        console.log('error', 'get-playlist-info err: ', e);
        res.send({ err: e });
    }
});

// Route để lấy thông tin kịch bản
router.get('/scripts', async (req, res) => {
    try {
        const { filter } = req.query;
        const ScriptModel = await getModel('Script');
        const scripts = await ScriptModel.find().sort('position');
        res.render('oam/scripts', { title: 'Scripts', scripts });
    } catch (e) {
        console.log('error', 'get-playlist-info err: ', e);
        res.send({ err: e });
    }
});

// Route để thêm email vào hồ sơ
router.post('/insert-profile-email', upload.single('profileFile'), async (req, res) => {
    try {
        console.log('insert-profile-email');
        const fileRows = [];
        const { type = '' } = req.query;

        csv.parseFile(req.file.path)
            .on('data', (data) => {
                fileRows.push(data);
            })
            .on('end', async () => {
                try {
                    fs.unlinkSync(req.file.path);

                    if (fileRows[0][0].indexOf('sep=') === 0) {
                        fileRows.shift();
                    }
                    const headers = fileRows.shift() || [];
                    if (fileRows[0][0].toLowerCase().indexOf('email') === 0) {
                        fileRows.shift();
                    }
                    const result = await oam_model.insertProfileEmail(fileRows, type, headers);
                    res.send(result);
                } catch (e) {
                    console.log('insert-profile-email err:', e);
                    res.send(e);
                }
            })
            .on('error', (e) => {
                console.error('parse profile err:', e);
                res.send(e);
            });
    } catch (e) {
        console.log('insert-profile-email err:', e);
        res.send(e);
    }
});

// Route để thêm proxy
router.post('/insert-proxy', upload.single('file'), async (req, res) => {
    const batchSize = 1000; // Số lượng bản ghi trong mỗi batch
    let batch = [];
    let totalInserted = 0;

    const stream = fs.createReadStream(req.file.path).pipe(csv.parse({ headers: true }));

    for await (const row of stream) {
        batch.push({
            server: row.server,
            username: row.username,
            password: row.password,
        });

        if (batch.length === batchSize) {
            await insertBatch(batch);
            totalInserted += batch.length;
            batch = [];
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
        totalInserted += batch.length;
    }

    fs.unlinkSync(req.file.path);
    res.json({ success: true, totalInserted });
});

async function insertBatch(batch) {
    try {
        const Proxy = getModel('Proxy');
        const startId = await getNextId(Proxy);
        const proxiesWithIds = batch.map((proxy, index) => ({
            ...proxy,
            id: startId + index,
        }));
        await Proxy.insertMany(proxiesWithIds, { ordered: false });
    } catch (error) {
        console.error('Error inserting batch:', error);
    }
}

async function getNextId(Model) {
    const ID = getModel('ID');
    const { seq } = await ID.findOneAndUpdate(
        { model: Model.modelName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
    );
    return seq;
}

// Route để thêm kênh
router.post('/insert-channel', upload.single('channelFile'), async (req, res) => {
    try {
        console.log('insert-channel');
        const fileRows = [];

        csv.parseFile(req.file.path)
            .on('data', (data) => {
                fileRows.push(data);
            })
            .on('end', async () => {
                try {
                    fs.unlinkSync(req.file.path);
                    if (fileRows[0][0].indexOf('sep=') === 0) {
                        fileRows.shift();
                    }
                    if (
                        fileRows[0][0].toLowerCase().indexOf('name') === 0 ||
                        fileRows[0][0].toLowerCase().indexOf('url') === 0
                    ) {
                        fileRows.shift();
                    }
                    const result = await oam_model.insertChannel(fileRows);
                    res.send(result);
                } catch (e) {
                    console.log('insert-channel err:', e);
                    res.send(e);
                }
            });
    } catch (e) {
        console.log('insert-channel err:', e);
        res.send(e);
    }
});

// Route để reset trạng thái hồ sơ
router.get('/reset-profile-status', async (req, res) => {
    try {
        const result = await oam_model.resetProfileStatus();
        res.send(result);
    } catch (e) {
        console.log('error', 'get-channel-info err: ', e);
        res.send({ err: e });
    }
});

// Route để reset sử dụng VPN
router.get('/reset-vpn-use', async (req, res) => {
    try {
        const result = await oam_model.resetVpnUse();
        res.send(result);
    } catch (e) {
        console.log('error', 'reset-vpn-use err: ', e);
        res.send({ err: e });
    }
});

// Route để tải xuống tệp tin
router.get('/download', (req, res) => {
    const { file: filename } = req.query;
    const file = path.join(__dirname, '..', 'template', filename);
    res.download(file);
});

// Route để lấy thông tin playlist
router.get('/get-playlist', async (req, res) => {
    try {
        console.log('start-playlist:', req.query);
        const result = await oam_model.getPlaylistInfo(1);
        res.send(result);
    } catch (e) {
        console.log('error', 'get-playlist err: ', e);
        res.send({ err: e });
    }
});

// Route để dừng playlist
router.get('/stop-playlist', async (req, res) => {
    try {
        console.log('stop-playlist:', req.query);
        const { videoId: url } = req.query;
        const result = await oam_model.stopPlaylist(url);
        res.send(result);
    } catch (e) {
        console.log('error', 'stop-playlist err: ', e);
        res.send({ err: e });
    }
});

// Route để dừng playlist (POST)
router.get('/stop-playlist', async function (req, res) {
    try {
        console.log('stop-playlist:', req.query);
        let url = req.query.videoId;
        let result = await oam_model.stopPlaylist(url);
        res.send(result);
    } catch (e) {
        console.log('error', 'stop-playlist err: ', e);
        res.send({ err: e });
    }
});

// Route để cập nhật kênh
router.get('/update-channel', async (req, res) => {
    try {
        console.log('update-channel:', req.query);
        const { ids, enable } = req.query;
        const result = await oam_model.updateChannel(ids, enable);
        res.send(result);
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để cập nhật một kênh
router.get('/update-single-channel', async (req, res) => {
    try {
        console.log('update-channel:', req.query);
        const { channel } = req.query;
        const result = await oam_model.updateSingleChannel(channel);
        res.send(result);
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để thêm playlist
router.get('/add-playlist', async (req, res) => {
    try {
        const video = req.query;
        const Playlist = await getModel('Playlist');
        await Playlist.create(video);
        res.send({ success: true });
    } catch (e) {
        console.log('error', 'create video err: ', e);
        res.send({ err: e });
    }
});

// Route để thêm video
router.get('/add-video', async (req, res) => {
    try {
        const video = req.query;
        const YTVideo = await getModel('YoutubeVideo');
        await YTVideo.create(video);
        res.send({ success: true });
    } catch (e) {
        console.log('error', 'create video err: ', e);
        res.send({ err: e });
    }
});

// Route để cập nhật một video
router.get('/update-single-video', async (req, res) => {
    try {
        console.log('update-video:', req.query);
        const { video } = req.query;
        const result = await oam_model.updateSingleVideo(video);
        res.send(result);
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để cập nhật kênh đủ
router.get('/update-enough-channel', async (req, res) => {
    try {
        console.log('update-enough-channel:', req.query);
        const result = await oam_model.updateEnoughChannel();
        res.send(result);
    } catch (e) {
        console.log('error', 'update-enough-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để lấy thông tin cấu hình
router.get('/config', async function (req, res) {
    try {
        console.log('get-config:', config);
        res.render('oam/config', { title: 'CONFIG', config: config });
    } catch (e) {
        console.log('error', 'get-config err: ', e);
        res.send({ err: e });
    }
});

// Route để cập nhật cấu hình
router.get('/update-config', async (req, res) => {
    try {
        console.log('update-config:', req.query);
        const updateConfig = req.query.config;
        updateConfig.FIRST_SUB_SEARCH_PLAYLIST = updateConfig.FIRST_SUB_SEARCH_PLAYLIST === 'false' ? false : true;
        fs.writeFile(
            path.join(__dirname, '..', 'config', 'config.js'),
            `module.exports=${JSON.stringify(updateConfig, null, 2)}`,
            (err) => {
                if (err) {
                    throw err;
                } else {
                    res.send({ result: 'update config ok' });
                    process.exit();
                }
            },
        );
    } catch (e) {
        console.log('error', 'update-channel err: ', e);
        res.send({ err: e });
    }
});

// Route để tạo AWS
router.get('/create-aws', async (req, res) => {
    try {
        process.env['AWS_ACCESS_KEY_ID'] = req.query.AWSAccessKeyId;
        process.env['AWS_SECRET_ACCESS_KEY'] = req.query.AWSSecretKey;
        const AWS = require('aws-sdk');
        const regions = [
            'us-east-2',
            'us-east-1',
            'us-west-1',
            'us-west-2',
            'ap-south-1',
            'ap-northeast-2',
            'ap-southeast-1',
            'ap-southeast-2',
            'ap-northeast-1',
            'ca-central-1',
            'eu-central-1',
            'eu-west-1',
            'eu-west-2',
            'eu-west-3',
            'eu-north-1',
            'sa-east-1',
        ];
        const amis = [
            'ami-0f2b4fc905b0bd1f1',
            'ami-02eac2c0129f6376b',
            'ami-074e2d6769f445be5',
            'ami-01ed306a12b7d1c96',
            'ami-02e60be79e78fef21',
            'ami-06cf2a72dadf92410',
            'ami-0b4dd9d65556cac22',
            'ami-08bd00d7713a39e7d',
            'ami-045f38c93733dd48d',
            'ami-033e6106180a626d0',
            'ami-04cf43aca3e6f3de3',
            'ami-0ff760d16d9497662',
            'ami-0eab3a90fc693af19',
            'ami-0e1ab783dc9489f34',
            'ami-5ee66f20',
            'ami-0b8d86d4bf91850af',
        ];

        const data = [];
        for (let i = 0; i < regions.length; i++) {
            const rs = {};
            AWS.config.update({ region: regions[i] });
            const ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });
            const paramsIngress = {
                GroupName: 'default',
                IpPermissions: [
                    {
                        IpProtocol: '-1',
                        FromPort: -1,
                        ToPort: -1,
                        IpRanges: [{ CidrIp: '0.0.0.0/0' }],
                    },
                ],
            };
            try {
                const sgi = await ec2.authorizeSecurityGroupIngress(paramsIngress).promise();
                console.log(sgi);
                rs.sgi = sgi;
            } catch (e) {
                console.log('error', 'authorizeSecurityGroupIngress', e);
                rs.sgi = e;
            }

            const instanceParams = {
                BlockDeviceMappings: [
                    {
                        DeviceName: '/dev/sda1',
                        Ebs: {
                            VolumeSize: 15,
                        },
                    },
                ],
                ImageId: amis[i],
                InstanceType: 't2.medium',
                MinCount: 1,
                MaxCount: 8,
                UserData:
                    'IyEvYmluL3NoDQpjdXJsIC1vIHN0YXJ0dXAuc2ggaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3ZhbnRydW5nbmd1eWVuMTAxL3NjcmlwdHMvbWFzdGVyL3J1bl92aWV3X3Byb3h5X3Rlc3Quc2ggJiYgY2htb2QgK3ggc3RhcnR1cC5zaCAmJiBzdWRvIC4vc3RhcnR1cC5zaCA+IGxvZy50eHQ=',
            };
            try {
                const instancePromise = await ec2.runInstances(instanceParams).promise();
                console.log(instancePromise);
                rs.instance = instancePromise;
            } catch (e) {
                console.log('error', 'runInstances', e);
                rs.instance = e;
            }

            data.push(rs);
        }
        res.send({ data });
    } catch (e) {
        console.log('error', 'create-aws err: ', e);
        res.send({ err: e });
    }
});

// Route để bắt đầu video
router.get('/start-video', async (req, res) => {
    try {
        console.log('start-video:', req.query);
        const { videoId, keyword } = req.query;
        const result = await oam_model.startVideo(videoId, keyword);
        res.send(result);
    } catch (e) {
        console.log('error', 'start-live err: ', e);
        res.send({ err: e });
    }
});

// Route để dừng video
router.get('/stop-video', async (req, res) => {
    try {
        console.log('stop-video:', req.query);
        const { videoId } = req.query;
        const result = await oam_model.stopVideo(videoId);
        res.send(result);
    } catch (e) {
        console.log('error', 'stop-live err: ', e);
        res.send({ err: e });
    }
});

// Route để lấy thông tin video
router.get('/get-video', async (req, res) => {
    try {
        console.log('stop-live:', req.query);
        const { videoId } = req.query;
        const result = await oam_model.getVideo(videoId);
        res.send(result);
    } catch (e) {
        console.log('error', 'get-live err: ', e);
        res.send({ err: e });
    }
});

module.exports = router;
