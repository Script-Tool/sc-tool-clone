const express = require('express');
const profile_model = require('../model/profile_model');
const fs = require('fs');
const path = require('path');
const { default: mongoose } = require('mongoose');

const router = express.Router();

// Route để khôi phục các profile bị lỗi
router.get('/revert-error', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);

        await ProfileModel.updateMany(filter, {
            status: 'NEW',
            description: '',
            total_bat: 0,
            total_created_users: 0,
        });

        res.json({ success: true });
    } catch (error) {
        console.log('Error while reverting profiles');
    }
});

// Route để cập nhật tổng số người dùng đã tạo
router.post('/update-total-created-users', async (req, res) => {
    const { pid, count } = req.body;
    const Profile = await getModel('Profile');
    await Profile.updateOne({ id: pid }, { total_created_users: Number(count) });

    res.send({ success: true });
});

// Route để cập nhật thông tin đã xem
router.post('/update-watched', async (req, res) => {
    const { viewed_ads } = req.body;
    countView++;
    if (viewed_ads && viewed_ads == 'true') {
        countAds++;
    }

    res.send({ err: null });
});

// Route để xóa tất cả các profile
router.get('/delete-all-profile', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const YoutubeProfileModel = await getModel('YoutubeProfile');
        const filter = ProfileModel.getQuery(req);

        const profiles = await ProfileModel.find(filter);

        await ProfileModel.deleteMany(filter);
        for (const profile of profiles) {
            await YoutubeProfileModel.deleteOne({
                profile: mongoose.Types.ObjectId(profile._id),
            });
        }

        ready_profiles = [];

        res.json({ success: true });
    } catch (error) {
        console.log('Error while deleting profiles');
    }
});

// Route để di chuyển các profile vào thùng rác
router.get('/move-to-trash', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);
        await ProfileModel.updateMany(filter, { status: 'TRASH' });
        res.json({ success: true });
    } catch (error) {
        console.log('Error while moving profiles to trash');
    }
});

// Route để xuất các profile ra file CSV
router.get('/export-profiles', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);
        const noDelete = req.query.no_delete;

        const rows = await ProfileModel.find(filter);

        if (rows.length) {
            let stringData = 'email,password,recover_mail,twoFA';
            const hasProxy = rows.some((row) => row.proxy_server && row.proxy_username && row.proxy_password);
            const hasBackupCode = rows.some((row) => row.backup_code);
            const hasElevenlabsKey = rows.some((row) => row.elevenlabs_key);

            if (rows[0].imap_email) {
                stringData += ',imap_email,imap_password';
            }
            if (hasProxy) {
                stringData += ',proxy_server,proxy_username,proxy_password';
            }
            if (hasBackupCode) {
                stringData += ',backup_code';
            }
            if (hasElevenlabsKey) {
                stringData += ',elevenlabs_key';
            }
            const dir = 'export';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            rows.forEach((row) => {
                stringData += '\n';
                stringData += `${row.email},${row.password},${row.recovery_mail || row.recover_mail || ''},${
                    row.twoFA || ''
                }`;

                if (row.imap_email && row.imap_password) {
                    stringData += `,${row.imap_email},${row.imap_password}`;
                }

                if (youtube_config.check_proxy_for_login) {
                    stringData += `,${row.proxy_server}`;
                }
                if (hasProxy) {
                    stringData += `,${row.proxy_server || ''},${row.proxy_username || ''},${row.proxy_password || ''}`;
                }

                if (hasBackupCode) {
                    stringData += `,${row.backup_code || ''}`;
                }
                if (hasElevenlabsKey) {
                    stringData += `,${row.elevenlabs_key || ''}`;
                }
            });

            if (!noDelete) {
                await ProfileModel.deleteMany(filter);
            }

            const filename = `${dir}/channels-${Date.now()}.csv`;
            fs.writeFileSync(filename, stringData);
            const filePath = path.join(rootDir, filename);
            return res.sendFile(filePath);
        }

        return res.send({ result: true });
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        console.log('Error while exporting profiles');
    }
});

// Route để xuất các gemini keys ra file CSV
router.get('/export-gemini-keys', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);

        const rows = await ProfileModel.find(filter);
        let stringData = '';
        if (rows.length) {
            const dir = 'export';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            stringData = rows
                .filter((row) => row?.gemini_key)
                .map((row) => row.gemini_key)
                .join('\n');

            const filename = `${dir}/channels-${Date.now()}.csv`;
            fs.writeFileSync(filename, stringData);
            const filePath = path.join(rootDir, filename);
            return res.sendFile(filePath);
        }

        return res.send({ result: true });
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        console.log('Error while exporting profiles');
    }
});

// Route để xuất các youtube keys ra file CSV
router.get('/export-youtube-keys', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);

        const rows = await ProfileModel.find(filter);
        let stringData = 'api_key,type\n';
        if (rows.length) {
            const dir = 'export';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            stringData += rows
                .filter((row) => row?.youtube_key)
                .map((row) => row.youtube_key + ',youtube_api')
                .join('\n');

            const filename = `${dir}/channels-${Date.now()}.csv`;
            fs.writeFileSync(filename, stringData);
            const filePath = path.join(rootDir, filename);
            return res.sendFile(filePath);
        }

        return res.send({ result: true });
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        console.log('Error while exporting profiles');
    }
});

// Route để xuất các channel links ra file CSV
router.get('/export-channel-links', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);

        const rows = await ProfileModel.find(filter);
        let stringData = '';
        if (rows.length) {
            const dir = 'export';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            stringData = rows
                .filter((row) => row?.channel_link)
                .map((row) => row.channel_link)
                .join('\n');

            const filename = `${dir}/channels-${Date.now()}.csv`;
            fs.writeFileSync(filename, stringData);
            const filePath = path.join(rootDir, filename);
            return res.sendFile(filePath);
        }

        return res.send({ result: true });
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        console.log('Error while exporting profiles');
    }
});

// / Route để xuất các emails ra file CSV
router.get('/export-emails', async (req, res) => {
    try {
        const ProfileModel = await getModel('Profile');
        const filter = ProfileModel.getQuery(req);

        const rows = await ProfileModel.find(filter);
        let stringData = '';
        if (rows.length) {
            const dir = 'export';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            stringData = rows
                .filter((row) => row?.email)
                .map((row) => row.email)
                .join('\n');

            const filename = `${dir}/channels-${Date.now()}.csv`;
            fs.writeFileSync(filename, stringData);
            const filePath = path.join(rootDir, filename);
            return res.sendFile(filePath);
        }

        return res.send({ result: true });
    } catch (error) {
        console.log('🚀 ~ router.get ~ error:', error);
        console.log('Error while exporting profiles');
    }
});

// Route để lấy profile sẵn sàng
router.get('/get-ok', async (req, res) => {
    try {
        const { vmId } = req.query;
        const profile = await profile_model.getOkProfile(vmId);
        res.send({ err: null, profile });
    } catch (e) {
        console.log('error', 'get-new err: ', e, ', param: ', req.query);
        res.send({ err: e });
    }
});

// Route để cập nhật trạng thái profile
router.post('/update-status', async (req, res) => {
    try {
        const { pid, status } = req.body;
        if (status === 'ERROR') {
            await getModel('Profile').updateOne({ id: pid }, { status, last_time_reset: Date.now() });
        }
        res.send({ err: null, success: true });
    } catch (e) {
        console.log('error', 'update-status err: ', e);
        res.send({ err: e });
    }
});

// Route để báo cáo đang xem
router.post('/report-watching', async (req, res) => {
    try {
        // TODO: handle this
        res.send({ err: null });
    } catch (e) {
        console.log('error', 'report-watching err: ', e);
        res.send({ err: e });
    }
});

module.exports = router;
