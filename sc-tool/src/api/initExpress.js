const request_api = require('../../request_api');
const { closeChrome } = require('../browser/closeChrome');
const fs = require('fs');
const settings = require('../settings');
const express = require('express');
const utils = require('../../utils');
const deleteProfile = require('../browser/deleteProfile');
const runUpdateVps = require('../execSync/runUpdateVps');
const app = express();
const addresses = require('../adress.json').addresses;
const request2 = require('request').defaults({ encoding: null });
const request = require('request-promise');
const { TIKTOK_CAPCHA_API_KEY, LOCAL_PORT, CHROME_VERSIONS } = require('../constants');
const path = require('path');
const getScriptData = require('./getScriptData');
const { rapidAPI } = require('./rapidAPI');

function initExpress() {
    app.get('/handle-capcha-tiktok', async (req, res) => {
        let data = req.query;
        let result = await handleCapchaTiktok(data);
        return res.json({ success: true, result });
    });

    app.get('/favicon.ico', (req, res) => {
        res.sendFile(path.resolve('favicon.ico'));
        return;
    });

    app.get('/debug', (req, res) => {
        settings.isPauseAction = true;
        res.send({ rs: 'ok' });
        return;
    });

    app.get('/report-playlist-jct', async (req, res) => {
        let rs = await request_api.reportPlaylistJCT(req.query);
        return res.send(rs);
    });

    app.get('/reset-profile-by-pid', async (req, res) => {
        const pid = req.query.pid;
        if (pid) {
            utils.log('--reset pid: ', pid);
            let updateData = {
                pid,
                status: 'NEW',
                description: 're_login',
            };

            removePidAddnew(pid, 0);
            await utils.sleep(5000);
            await request_api.updateProfileData(updateData);
        }
        return res.send({ success: true });
    });

    app.get('/get-comment', async (req, res) => {
        let rs = await request_api.getComment();
        return res.send(rs);
    });

    app.get('/get-phone', async (req, res) => {
        let rs = await request_api.getPhone(req.query.re_phone);
        console.log('getPhone', rs);
        res.send(rs);
        return;
    });

    app.get('/update-profile-data', async (req, res) => {
        let data = req.query;
        request_api.updateProfileData(data);
        res.send({});
        return;
    });

    app.get('/get-address-random', async (req, res) => {
        utils.log('/get-address-random', addresses.length);
        const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
        utils.log('/get-address-random', randomAddress);
        return res.send(randomAddress);
    });

    app.get('/report-fb-group', async (req, res) => {
        let groupLink = req.query.group_link;
        let groupTopic = req.query.fb_topic_code;
        utils.log('---groupLink--', groupLink);
        let rs = await request_api.reportFBGroup(groupLink, groupTopic);
        res.send(rs);
        return;
    });

    app.get('/get-phone-code', async (req, res) => {
        let order_id = req.query.order_id;
        let api_name = req.query.api_name;
        let rs = await request_api.getPhoneCode(order_id, api_name);
        res.send(rs);
        return;
    });

    app.get('/get-mail-code', async (req, res) => {
        let mail = req.query.mail;
        let rs = await request_api.getMailCode(mail);
        res.send(rs);
        return;
    });

    app.get('/report-mail-code', async (req, res) => {
        let data = req.query;
        let rs = await request_api.reportMailCode(data);
        res.send(rs);
        return;
    });

    app.get('/get-reco-mails', async (req, res) => {
        utils.log('get reco mail');
        let data = req.query;
        let rs = await request_api.getRecoMails(data);
        utils.log('get reco rs', rs);
        res.send(rs);
        return;
    });

    app.get('/login', (req, res) => {
        utils.log('/login', req.query);
        if (req.query.status == 1) {
            utils.log('/login', req.query.pid, 'login success');
            request_api.updateProfileStatus(req.query.pid, config.vm_id, 'SYNCED');
        } else {
            utils.log(req.query.pid, 'login error', req.query.msg);
            request_api.updateProfileStatus(req.query.pid, config.vm_id, 'ERROR', req.query.msg);
        }
        removePidAddnew(req.query.pid, req.query.status);

        res.send({ rs: 'ok' });
    });

    app.get('/get-new-playlist', async (req, res) => {
        let rs = await request_api.getYTVideo();
        let playlist = rs.playlist;
        handlePlaylistData(playlist);
        res.send(playlist);
    });

    app.get('/report', async (req, res) => {
        if (settings.isPauseAction) {
            //res.send({ rs: 'ok' })
            return;
        }

        // Xóa profile sau mỗi lần chạy script
        if (
            systemConfig.delete_profile_after_run_script &&
            ['watch_video', 'like_youtube', 'youtube_sub', 'comment_youtube', 'watch'].includes(req.query.script_code)
        ) {
            utils.log('Xoá profiles ok', req.query, systemConfig.delete_profile_after_run_script);

            await deleteProfile(req.query.pid);
            removePidAddnew(req.query.pid, 1);
        }

        if (
            req.query.id == 'reg_account' ||
            req.query.id == 'change_pass' ||
            req.query.id == 'get_youtube_key' ||
            req.query.id == 'channel_appeal' ||
            req.query.id == 'changing_to_vietnamese_name' ||
            req.query.id == 'khanh_kenh_account' ||
            req.query.id == 'reg_account_chatgpt' ||
            req.query.id == 'reg_account_elevenlabs' ||
            req.query.id == 'reg_account_murf'
        ) {
            let action = req.query;

            if (req.query.id == 'change_pass' && req.query.status == '0') {
                if (req.query.msg.startsWith('UPDATE_FB_SUCCESS_TO_')) {
                    req.query.msg = req.query.msg.replace('UPDATE_FB_SUCCESS_TO_', '');
                    request_api.updateProfileData({
                        pid: req.query.pid,
                        status: 'ERROR',
                        password: req.query.msg,
                        description: 'update_success',
                        proxy_server:
                            proxy[req.query.pid] && proxy[req.query.pid].server ? proxy[req.query.pid].server : '',
                    });
                } else {
                    request_api.updateProfileData({
                        pid: req.query.pid,
                        status: 'ERROR',
                        description: req.query.msg,
                    });
                }
                return res.json({});
            }

            if (action.username && action.password) {
                request_api.reportAccount({
                    username: action.username,
                    password: action.password,
                    verify: action.verify,
                    ...(action.accountStatus ? { status: action.accountStatus } : {}),
                    type: action.type,
                    reg_ga_success: action.reg_ga_success,
                    proxy_server: proxy[action.pid] && proxy[action.pid].server ? proxy[action.pid].server : '',
                });

                if (req.query.id == 'change_pass') {
                    request_api.updateProfileData({
                        pid: req.query.pid,
                        status: 'TRASH',
                        description: 'update_pass_to_' + action.password,
                    });
                }
            }

            if (action.reg_ga_success) {
                request_api.updateProfileData({
                    pid: Number(action.pid),
                    status: 'ERROR',
                    description: 'ga',
                });
            }

            /**
             * Xoá profile đi và lấy profle mới
             * 1 . lấy youtube key
             * 2 . vào mail kháng cáo kênh
             * 3 . thay đổi tên google
             */
            if (
                req.query.id == 'get_youtube_key' ||
                req.query.id == 'channel_appeal' ||
                req.query.id == 'changing_to_vietnamese_name' ||
                req.query.id == 'khanh_kenh_account'
            ) {
                request_api.updateProfileData({
                    pid: req.query.pid,
                    status: 'ERROR',
                    description: req.query.msg,
                });
            }

            if (action.stop && action.stop != 'false') {
                removePidAddnew(req.query.pid, 0);
            }
        } else if (req.query.id == 'total_created_channel') {
            const profileData = {
                pid: req.query.pid,
                total_created_users: req.query.count,
            };

            // Chỉ thêm description nếu có blockChannel
            if (req.query.blockChannel && req.query.blockChannel != 0) {
                profileData.description = 'số tài khoản bị khoá ' + req.query.blockChannel;
            }

            request_api.updateProfileData(profileData);
        } else if (req.query.id == 'live_report') {
            runnings.forEach((running) => {
                if (running.pid == req.query.pid) {
                    running.lastReport = Date.now();
                }
            });
        }
        // Xu ly report
        else if (req.query.isScriptReport) {
            if (req.query.status == 'ERROR_TYPE_1') {
                req.query.isBreak = true;
                let pid = req.query.pid;
                if (!settings.ERROR_TYPE_1_MAP[pid]) {
                    settings.ERROR_TYPE_1_MAP[pid] = 1;
                }

                settings.ERROR_TYPE_1_MAP[pid]++;
                if (settings.ERROR_TYPE_1_MAP[pid] > 3) {
                    delete settings.ERROR_TYPE_1_MAP[pid];
                    removePidAddnew(pid, 0);
                }
                return;
            }
            if (
                !['watch', 'create_playlist', 'search', 'end_script'].includes(req.query.script_code)
                // Chỉ những trường hợp lỗi chưa tạo audio mới gửi api tránh gửi 2 lần với trường hợp không lỗi
            ) {
                try {
                    await request_api.reportScript(
                        req.query.pid,
                        req.query.service_id,
                        req.query.status,
                        req.query.data_reported,
                    );
                } catch (error) {}
            }

            if (req.query.script_code == 'add_recovery_mail' && !req.query.data_reported.includes('p_not_found_code')) {
                closeChrome(req.query.pid);
                deleteProfile(req.query.pid);
                settings.ids = settings.ids.filter((i) => i != req.query.pid);
                runnings = runnings.filter((i) => i.pid != req.query.pid);
                return;
            }
            if ([1, '1', 'true', true].includes(req.query.isBreak)) {
                // execSync(`xdotool key Control_L+w && sleep 1`)
                // browser will closed by background extention
                closeChrome(req.query.pid);
                runnings = runnings.filter((i) => i.pid != req.query.pid);
            } else {
                let action = await getScriptData(req.query.pid);

                if (req?.query?.script_code == action?.script_code) {
                    closeChrome(req.query.pid);
                    runnings = runnings.filter((i) => i.pid != req.query.pid);
                } else {
                    runnings.forEach((running) => {
                        if (running.pid == req.query.pid) {
                            running.lastReport = Date.now();
                        }
                    });
                    return res.json(action);
                }
            }
        } else if (req.query.id == 'channel-position') {
            let channel = usersPosition.find((u) => u.pid == req.query.pid);
            if (channel) {
                channel.position = req.query.position;
            } else {
                usersPosition.push({
                    pid: req.query.pid,
                    position: req.query.position,
                });
            }

            if (usersPosition) {
                config.usersPosition = usersPosition;
                fs.writeFileSync('vm_log.json', JSON.stringify(config));
            }
        } else if (req.query.id == 'watched') {
            runnings.forEach((running) => {
                if (running.pid == req.query.pid) {
                    running.lastReport = Date.now();
                }
            });
            request_api.updateWatchedVideo(req.query.pid, req.query.viewedAds);
        } else if (
            (req.query.report_error_profile && req.query.report_error_profile != 'false') ||
            req.query.id == 'login' ||
            req.query.id == 'reg_user' ||
            req.query.id == 'reg_user_youtube' ||
            req.query.id == 'check_mail_1' ||
            req.query.id == 'recovery_mail'
        ) {
            if (req.query.status == 1) {
                utils.log(req.query.pid, 'login success');
                if (req.query.id == 'reg_user') {
                    request_api.updateProfileData({
                        pid: req.query.pid,
                        status: 'ERROR',
                    });
                } else {
                    let params = {
                        pid: req.query.pid,
                        status: 'SYNCED',
                        vm_id: config.vm_id,
                    };
                    if (systemConfig.is_fb) {
                        params.proxy_server =
                            proxy[req.query.pid] && proxy[req.query.pid].server ? proxy[req.query.pid].server : '';
                    }
                    request_api.updateProfileData(params);
                }
            } else {
                utils.log(req.query.pid, 'login error', req.query.msg);
                request_api.updateProfileData({
                    pid: req.query.pid,
                    status: 'ERROR',
                    description: req.query.msg,
                });
            }
            removePidAddnew(req.query.pid, req.query.status);
        } else if (req.query.id == 'logout') {
            utils.log(req.query.pid, 'logout ok');
            request_api.updateProfileStatus(req.query.pid, config.vm_id, 'ERROR', 'disabled_logout');
            settings.ids = settings.ids.filter((x) => x != req.query.pid);
            deleteProfile(req.query.pid);
        } else if (req.query.id == 'confirm') {
            utils.log(req.query.pid, 'confirm', req.query.status);
            if (req.query.status == 1) {
                utils.log(req.query.pid, 'confirm success');
                request_api.updateProfileStatus(req.query.pid, config.vm_id, 'SYNCED', 'CONFIRM_SUCCESS');
            } else {
                utils.log(req.query.pid, 'confirm error', req.query.msg);
                request_api.updateProfileStatus(req.query.pid, config.vm_id, 'SYNCED', req.query.msg);
            }
        } else if (req.query.id == 'changepass') {
            request_api.updateProfileStatus(req.query.pid, config.vm_id, 'SYNCED', req.query.msg);
        } else if (req.query.id == 'checkpremium' || req.query.id == 'checkcountry') {
            request_api.updateProfileStatus(req.query.pid, config.vm_id, 'SYNCED', req.query.msg);
        } else if (req.query.id == 'watch') {
            if (req.query.stop == 'true' || req.query.stop == true) {
                runnings = runnings.filter((i) => i.pid != req.query.pid);
            }
        } else if (req.query.id == 'sub') {
            if (req.query.stop == 'true' || req.query.stop == true) {
                utils.log('remove pid from subRunnings', req.query.pid);
                subRunnings = subRunnings.filter((x) => x.pid != req.query.pid);
            }
        }
        if (req.query.msg && req.query.msg == 'NOT_LOGIN') {
            utils.log('error', req.query.pid, 'NOT_LOGIN');
            deleteProfile(req.query.pid);
            settings.ids = settings.ids.filter((x) => x != req.query.pid);
            // deleteBackup(req.query.pid)
        }
        res.send({ rs: 'ok' });
    });

    app.get('/run-update-vps', (req, res) => {
        runUpdateVps();
        res.send({ success: true });
    });

    app.get('/action', (req, res) => {
        res.send(JSON.stringify(req.query));
    });

    app.get('/input', async (req, res) => {
        settings.actionsData.push({ ...req.query, res });
    });

    app.listen(LOCAL_PORT, () => {
        utils.log('start app on', LOCAL_PORT);
    });

    app.get('/add-key', async (req, res) => {
        let data = req.query;
        request_api.addKey(data);
        res.send({});
        return;
    });

    app.get('/get-code-2fa', async (req, res) => {
        let rs = await request_api.getCode2FAFacebook(req.query.token);
        res.send(rs);
        return;
    });

    // Server endpoint
    app.get('/change-chrome-version', async (req, res) => {
        try {
            // Log
            console.log('systemConfig?.change_chrome_version', systemConfig?.change_chrome_version);
            return res.send({
                success: true,
                change_chrome_version: systemConfig?.change_chrome_version || false,
            });
        } catch (error) {
            return res.send({
                success: true,
                change_chrome_version: false,
            });
        }
    });

    app.get('/info-profile', async (req, res) => {
        const pid = req.query.pid;

        const rs = await request_api.getInfoProfile(pid);
        res.send(rs);
        return;
    });

    app.get('/create-temp-mail', async (req, res) => {
        let data = await rapidAPI.createTempMail();
        console.log('/create-temp-mail', data);

        return res.send(data);
    });

    app.get('/get-list-mails', async (req, res) => {
        const inboxId = req.query.inboxId;
        let data = await rapidAPI.getListMails(inboxId);
        console.log('/create-temp-mail', data);

        return res.json(data);
    });

    app.get('/get-random-name', async (req, res) => {
        const data = await request_api.getRandomName();
        return res.json(data);
    });

    app.get('/save-chatgpt-account', async (req, res) => {
        const data = await request_api.saveChatgptAccount(req.query);
        // closeChrome();

        return res.json(data);
    });

    app.get('/report-chatgpt-profile', async (req, res) => {
        const { pid, serviceId, status, msg, _id } = req.query;

        await request_api.updateProfileData({ pid: Number(pid), status: 'RESET' });
        await request_api.reportScript(pid, serviceId, false, msg);
        removePidAddnew(pid, status);
        return res.send({ rs: 'ok' });
    });

    app.get('/error-profile', async (req, res) => {
        const { pid, serviceId, status, msg, _id } = req.query;

        await request_api.updateProfileData({ pid: Number(pid), status: 'ERROR' });
        await request_api.reportScript(pid, serviceId, false, msg);
        removePidAddnew(pid, status);
        return res.send({ rs: 'ok' });
    });

    app.get('/get-youtube-profile', async (req, res) => {
        return res.send({ data: youtubeProfile });
    });
}

module.exports = initExpress;

function removePidAddnew(pid, status) {
    utils.log('removePidAddnew ', status, settings.IS_REG_USER);
    try {
        runnings = runnings.filter((x) => x.pid != pid);
        if (status != 1 || settings.IS_REG_USER) {
            // login error
            deleteProfile(pid);
            utils.log('deleteProfile', pid, status);
        } else {
            // login success
            closeChrome(pid);
            if (!settings.ids.filter((x) => x == pid).length) {
                settings.ids.push(pid);
            }
        }

        if (settings.IS_REG_USER) {
            settings.ids = settings.ids.filter((x) => x != pid);
        }
        utils.log('/login', settings.ids);
    } catch (e) {
        utils.log('error', 'removePidAddnew', pid, status, addnewRunnings, settings.ids, e);
    }
}

function handlePlaylistData(playlist) {
    if (!playlist.total_times_next_video) {
        delete playlist.total_times_next_video;
    }
    if (!playlist.watching_time_non_ads) {
        delete playlist.watching_time_non_ads;
    }
    if (!playlist.watching_time_start_ads) {
        delete playlist.watching_time_start_ads;
    }
    if (!playlist.watching_time_end_ads) {
        delete playlist.watching_time_end_ads;
    }
}

async function handleCapchaTiktok(data) {
    let job;
    if (data.type == 'cicle') {
        let innerImage = '';
        let outerImage = '';
        await Promise.all([getBase64FromUrl(data.innerImageURL), getBase64FromUrl(data.outerImageURL)]).then((rs) => {
            innerImage = rs[0];
            outerImage = rs[1];
        });

        // send data to api
        job = await createJob({
            type_job_id: 23,
            image_base64: innerImage + '|' + outerImage,
        });
    } else if (data.type == 'square') {
        // shot screen
        let capchaImgName = 'tiktokCapcha' + Date.now();
        execSync(
            `${nircmdPath} savescreenshot ${path.resolve('logscreen')}/${capchaImgName}.png ${data.startImageX} ${
                data.startImageY
            } ${data.endImageX - data.startImageX} ${data.endImageY - data.startImageY}`,
        );
        let imageBase64 = fs.readFileSync(`${path.resolve('logscreen')}/${capchaImgName}.png`, { encoding: 'base64' });
        job = await createJob({
            type_job_id: 21,
            image_base64: imageBase64,
            width_view: data.image_width,
        });
    }
    let result = { status: 'waiting' };
    while (result.status == 'waiting' || result.status == 'running') {
        result = await getJobResult(job.job_id);
        await utils.sleep(3000);
    }
    utils.log('final res', result);
    return result;
}

const getBase64FromUrl = async (url) => {
    return new Promise((resolve) => {
        request2.get(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(body.toString('base64'));
            }
        });
    });
};

async function getJobResult(job_id) {
    try {
        const url = 'https://omocaptcha.com/api/getJobResult';
        const requestData = {
            api_token: TIKTOK_CAPCHA_API_KEY,
            job_id,
        };
        return new Promise((resolve, reject) => {
            request['post'](
                {
                    url,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    json: true,
                    body: requestData,
                },
                async (err, response, data) => {
                    return resolve(data);
                },
            );
        });
    } catch (err) {
        utils.log('Error while getResult', err);
    }
}

async function createJob(capchaData) {
    try {
        const url = 'https://omocaptcha.com/api/createJob';
        const requestData = {
            api_token: TIKTOK_CAPCHA_API_KEY,
            data: capchaData,
        };

        return new Promise((resolve, reject) => {
            request['post'](
                {
                    url,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    json: true,
                    body: requestData,
                },
                async (err, response, data) => {
                    utils.log('--', data);
                    if (data.job_id) {
                        return resolve({
                            success: true,
                            job_id: data.job_id,
                        });
                    }
                    return reject({ success: false, data, err });
                },
            );
        });
    } catch (err) {
        utils.log('Error while getRequest', err);
    }
}
