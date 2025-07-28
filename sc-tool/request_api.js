const request = require('request-promise');
const fs = require('fs');
const SUB_URL = `http://${devJson.hostIp}`;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const path = require('path');
const del = require('del');

function rq(data) {
    data.headers = {
        api_key: process.env.API_KEY,
    };
    return request(data);
}

module.exports = {
    getRandomImage: async function () {
        return await rq({
            uri: SUB_URL + '/api-alex/media/random-image',
            encoding: null,
        });
    },
    getImageByName: async function (image_name) {
        return await rq({
            method: 'GET',
            uri: SUB_URL + `/api-alex/media/images/${image_name}`,
            encoding: null,
        });
    },
    reportFBGroup: async function (groupLink, groupTopic) {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/script/report-fb-group',
            body: { group_link: groupLink, fb_topic_code: groupTopic },
            json: true,
        });
    },
    reportAccount: async function (data) {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/account',
            body: data,
            json: true,
        });
    },
    getRandomName: async () => {
        try {
            let rs = await rq({
                uri: 'https://namey.muffinlabs.com/name.json',
                json: true,
            });

            let nameParts = rs[0].split(' ');

            return {
                last_name: nameParts[nameParts.length - 1],
                first_name: nameParts.slice(0, -1).join(' '),
            };
        } catch (error) {
            return {
                last_name: makeName(5),
                first_name: makeName(5),
            };
        }
    },
    reportPlaylistJCT: async (data) => {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/playlist/report/playlist_jct',
            body: data,
            json: true,
        });
    },
    getComment: async () => {
        return await rq({
            uri: SUB_URL + '/api-alex/data/comment?type=youtube',
            json: true,
        });
    },
    getPhone: async (re_phone) => {
        return await rq({
            uri: SUB_URL + `/api-alex/phone?re_phone=${re_phone}`,
            json: true,
        });
    },
    getMailCode: async (mail) => {
        return await rq({
            uri: SUB_URL + `/api-alex/phone/mail-code?mail=${mail}`,
            json: true,
        });
    },
    reportMailCode: async (data) => {
        return await rq({
            uri: SUB_URL + `/api-alex/phone/report-mail-code?pid=${data.pid}&codes=${data.codes}`,
            json: true,
        });
    },
    getRecoMails: async (data) => {
        return await rq({
            uri: SUB_URL + `/api-alex/phone/get-reco-mails?mail=${data.mail}&pid=${data.pid}`,
            json: true,
        });
    },
    getPhoneCode: async (orderID, api_name) => {
        return await rq({
            uri: SUB_URL + `/api-alex/phone/code?order_id=${orderID}&api_name=${api_name}`,
            json: true,
        });
    },
    getProfileForRegChannel: async (pid = 0) => {
        return await rq({
            uri: SUB_URL + '/api-alex/profile/get-for-reg-channel?pid=' + pid,
            json: true,
        });
    },
    reportUpgrade: async () => {
        return await rq({
            uri: SUB_URL + '/report-upgrade?vmId=' + config.vm_id,
            json: true,
        });
    },
    getProxyV4: async (data) => {
        let query = '';
        if (data) {
            query = '?api_id=' + data.api_id + '&isLoadNewProxy=' + data.isLoadNewProxy;
        }

        return await rq({
            uri: SUB_URL + '/api-alex/proxy/get-proxy-v4' + query,
            json: true,
        });
    },
    updateProfileData: async (data) => {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/profile/update-data',
            body: data,
            json: true,
        });
    },
    getBraveInfo: async (pid) => {
        return await rq({
            uri: SUB_URL + '/api-alex/profile/get-brave-info?pid=' + pid,
            json: true,
        });
    },
    getRandomKeyWord: async () => {
        return await rq({
            uri: 'https://random-data-api.com/api/commerce/random_commerce',
            json: true,
        });
    },
    reportScript: async (pid, serviceId = '', status = true, data_reported = '') => {
        return await rq({
            uri: SUB_URL + '/api-alex/script/report',
            json: true,
            qs: { _id: serviceId, pid: pid, status: status, data_reported },
        });
    },
    getNewScript: async (pid) => {
        const action = await rq({
            uri: SUB_URL + '/api-alex/script/get-new?pid=' + pid,
            json: true,
        });

        return action;
    },
    checkToUpdate: async () => {
        try {
            return await rq({
                uri: SUB_URL + '/api-alex/vm/get-to-update?vmId=' + config.vm_id,
                json: true,
            });
        } catch (error) {
            return false;
        }
    },
    getYTVideo: async (pid = '') => {
        return await rq({
            uri: SUB_URL + '/api-alex/playlist/YTVideo',
            json: true,
            qs: { vmId: config.vm_id, pid: pid },
        });
    },
    getNewProfile: async () => {
        return await rq({
            uri: SUB_URL + '/api-alex/profile',
            json: true,
            qs: { vmId: config.vm_id },
        });
    },
    getInfoProfile: async (pid) => {
        return await rq({
            uri: SUB_URL + '/api-alex/profile/info',
            json: true,
            qs: { pid: pid },
        });
    },
    updateProfileStatus: async (pid, vmId, status, description) => {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/profile/update-status',
            body: { pid: pid, vmId: vmId, status: status, description: description },
            json: true,
        });
    },
    getSubChannels: async (pid, vmId, proxy) => {
        return await rq({
            uri: SUB_URL + '/playlist/get-sub-channels',
            json: true,
            qs: { pid: pid, vmId: vmId, proxy: proxy },
        });
    },
    getPlaylist: async (pid, action) => {
        return await rq({
            uri: SUB_URL + '/playlist/get-playlist',
            json: true,
            qs: { pid: pid, vmId: config.vm_id, action: action },
        });
    },
    updateWatchedVideo: async (pid, viewedAds) => {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/profile/update-watched',
            json: true,
            body: { pid: pid, viewed_ads: viewedAds },
        });
    },
    getChannelSub: async (channelId) => {
        const apiUrl =
            'https://www.googleapis.com/youtube/v3/channels?part=statistics&key=AIzaSyCVfKZdlQgwiFY-lEeZ6xKsgUBTbTEDZWA&id=';
        return await rq({
            uri: apiUrl + channelId,
            json: true,
            qs: { vmId: config.vm_id },
        });
    },
    getProfileProxy: async (pid, action, isLoadNewProxy = '') => {
        return await rq({
            uri: SUB_URL + '/api-alex/proxy/get-profile-proxy',
            json: true,
            qs: { pid: pid, action, isLoadNewProxy },
        });
    },
    updateProxy: async (data) => {
        await axios.put(SUB_URL + '/api-alex/proxy', data, {
            headers: {
                api_key: process.env.API_KEY,
            },
        });
    },
    getSystemConfig: async () => {
        try {
            return await rq({
                uri: SUB_URL + '/api-alex/config/system?vmId=' + config.vm_id,
                json: true,
            });
        } catch (e) {
            return false;
        }
    },
    reportVM: async (data = {}) => {
        try {
            return await rq({
                uri: SUB_URL + '/api-alex/vm/report',
                json: true,
                qs: data,
            });
        } catch (e) {}
    },
    getNavigator: async (pid, os = 'Windows', browser = 'Chrome', seo) => {
        try {
            let nav = await rq({
                uri: `https://dominhit.pro/api?action=get-fingerprint&os=${os}&browser=${browser}&id=${pid}&seo=${seo}`,
            });
            nav = JSON.parse(nav);
            nav = JSON.parse(nav.data.data);
            return nav;
        } catch (e) {}
    },
    getRandomAvatar: async function () {
        try {
            const url = 'https://100k-faces.glitch.me/random-image';
            const fileName = 'avatar.jpg';
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const outputDir = path.resolve('../');
            const outputFilePath = path.join(outputDir, fileName);
            await del([outputFilePath], { force: true });

            fs.writeFileSync(outputFilePath, response.data);
            return true;
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    },
    getAvatarByName: async function (image_name) {
        try {
            const url = SUB_URL + `/api-alex/media/images/${image_name}`;
            const fileName = 'avatar.jpg';
            const headers = {
                api_key: 'f3xQ8tLm', // Thay your_access_token bằng token thực tế nếu có
            };

            const response = await axios.get(url, {
                headers,
                responseType: 'arraybuffer',
            });

            const outputDir = path.resolve('../');
            const outputFilePath = path.join(outputDir, fileName);

            // Xóa file nếu tồn tại
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }

            // Ghi file mới
            fs.writeFileSync(outputFilePath, response.data);
            return true;
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    },
    addKey: async (data) => {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/api-key/add-key',
            body: data,
            json: true,
        });
    },
    getCode2FAFacebook: async (token) => {
        try {
            const res = await axios.get(`https://2fa.live/tok/${token}`);
            return res?.data || {};
        } catch (error) {
            return {};
        }
    },
    getYoutubeContent: async (pid) => {
        try {
            const response = await axios.get(`${SUB_URL}/api-alex/youtube-content/content/${pid}`, {
                headers: {
                    api_key: process.env.API_KEY,
                },
            });

            if (!response.data.success || !response.data.content) {
                return {
                    success: false,
                    error: response.data.error || 'Failed to fetch content',
                };
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching YouTube content:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch content',
            };
        }
    },
    publishVideo: async (pid, videoId, data) => {
        return await rq({
            method: 'PUT',
            uri: `${SUB_URL}/api-alex/youtube-profile/${pid}/video/${videoId}/publish`,
            body: { ...data },
            json: true,
        });
    },
    setupCompleted: async (pid) => {
        return await rq({
            method: 'PUT',
            uri: `${SUB_URL}/api-alex/youtube-profile/${pid}/setup-upload-defaults-completed`,
            body: {},
            json: true,
        });
    },
    saveChatgptAccount: async function (data) {
        return await rq({
            method: 'POST',
            uri: SUB_URL + '/api-alex/account/save-chatgpt-account',
            body: data,
            json: true,
        });
    },
    saveSceneAudio: async function (serverUrl, serverKey, data) {
        const urlSv = serverUrl;

        try {
            await axios.post(`${urlSv}/tool-service-api/story-videos/save`, data, {
                headers: { Authorization: 'Bearer ' + serverKey },
            });
        } catch (error) {
            console.error('Error sending data to server:', error);
        }
    },
    getApiKey: async function (model) {
        const modelTypeMap = {
            'gemini-2.5-flash-preview-tts': 'gemini_key',
            'murf-tts': 'murf_key',
        };

        const type = modelTypeMap[model] || (model.includes('eleven') ? 'elevenlabs_key' : 'minimax_key');

        try {
            const { data } = await axios.get(`${SUB_URL}/api-alex/api-key/get-api-key`, {
                params: { type },
                headers: { api_key: process.env.API_KEY },
                timeout: 5000,
            });

            return data.apiKey;
        } catch (error) {
            console.error(`Failed to get API key for ${model}:`, error.message);
            throw error;
        }
    },
    checkExistingAudio: async (serverUrl, serverKey, sceneId, storyId) => {
        const urlSv = serverUrl;

        try {
            const res = await axios.post(
                `${urlSv}/tool-service-api/story-videos/audio/check`,
                { sceneId, storyId },
                {
                    headers: { Authorization: 'Bearer ' + serverKey },
                },
            );

            return res.data;
        } catch (error) {
            console.error('Error sending data to server:', error);
        }
    },
    updateApiKey: async function (data) {
        try {
            await axios.put(`${SUB_URL}/api-alex/api-key/update-api-key`, data, {
                headers: {
                    api_key: process.env.API_KEY,
                },
            });
        } catch (error) {
            console.error('Error sending data to server:', error);
        }
    },
};
