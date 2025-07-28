const request_api = require('../../request_api');
const utils = require('../../utils');
const settings = require('../settings');
const { PLAYLIST_ACTION } = require('../constants');
const { handleContent } = require('../utils/handleString');
const cleanupDirectory = require('../utils/deleteAllFile');
const os = require('os');
const checkProxy = require('../utils/checkProxy');

const currentUser = os.userInfo().username;
const downloadDir = `/home/${currentUser}/Downloads`;

/**
 * Main function - Get script data for processing
 */
async function getScriptData(pid, isNewProxy = false) {
    try {
        // Step 1: Get action info
        let action = await getActionInfo(pid, isNewProxy);

        if (!action) return null;
        if (action?.pid) {
            pid = action.pid;
        }

        // Step 2: Setup proxy
        const proxyOk = await setupProxy(action, pid, isNewProxy);
        if (!proxyOk) return null;

        // Step 3: Set default configuration
        setDefaultConfig(action, pid);

        // Step 4: Process special scripts
        return action;
    } catch (error) {
        utils.log(`Error in getScriptData: ${error.message}`);
        return null;
    }
}

/**
 * Get action info based on user type
 */
async function getActionInfo(pid, isNewProxy) {
    await utils.sleep(2000);
    return settings.IS_REG_USER ? await handleRegisteredUser(pid, isNewProxy) : await handleRegularUser(pid);
}

/**
 * Handle registered user
 */
async function handleRegisteredUser(pid, isNewProxy) {
    const configMap = {
        khanh_kenh_account: () => createKhanhKenhAction(),
        unsub_youtube: () => createRegChannelAction(),
        is_change_pass: () => createRegChannelAction(pid),
        is_reg_account: () => handleRegAccount(pid),
        is_check_mail_1: () => createCheckMailAction(),
        is_reg_ga: () => createRegGmailAction(),
    };

    for (const [key, handler] of Object.entries(configMap)) {
        if (systemConfig[key] && systemConfig[key] !== 'false') {
            return await handler();
        }
    }

    return await createDefaultAction(pid);
}

/**
 * Handle reg account logic
 */
async function handleRegAccount(pid) {
    if (systemConfig.new_account_type === 'facebook') {
        return await createRegFacebookAction(pid);
    }
    return { script_code: 'reg_account', account_type: 'gmail' };
}

/**
 * Create action for Khanh Kenh
 */
async function createKhanhKenhAction() {
    const newProfile = await request_api.getNewProfile();
    if (newProfile.err || !newProfile.profile) {
        utils.log('Not found profile');
        return null;
    }

    return {
        ...newProfile.profile,
        script_code: 'khanh_kenh_account',
        khanh_kenh_account_noi_dung: systemConfig.khanh_kenh_account_noi_dung,
    };
}

/**
 * Create action for reg channel
 */
async function createRegChannelAction(pid) {
    const action = await request_api.getProfileForRegChannel(pid);
    if (!action) {
        utils.log('Not found user data.');
        return null;
    }

    action.pid = action.id;
    return action;
}

/**
 * Create action for reg Facebook
 */
async function createRegFacebookAction(pid) {
    const action = await createRegChannelAction(pid);
    if (action) {
        action.pid = utils.randomRanger(100, 400);
        updateSettingsIds(action.pid);
    }
    return action;
}

/**
 * Create action for check mail
 */
async function createCheckMailAction() {
    const newProfile = await request_api.getNewProfile();
    if (newProfile.err || !newProfile.profile) {
        utils.log('Not found profile');
        return null;
    }

    return {
        ...newProfile.profile,
        mail_type: systemConfig.check_mail_1_type,
        script_code: 'check_mail_1',
    };
}

/**
 * Create action for reg Gmail
 */
async function createRegGmailAction() {
    const newProfile = await request_api.getNewProfile();
    if (newProfile.err || !newProfile.profile) {
        utils.log('Not found profile');
        return null;
    }

    return {
        ...newProfile.profile,
        script_code: 'reg_account',
        account_type: 'gmail',
        process_login: true,
    };
}

/**
 * Create default action
 */
async function createDefaultAction(pid) {
    if (settings.ids.length < settings.MAX_PROFILE) {
        pid = 0;
    }

    const action = await request_api.getProfileForRegChannel(pid);

    if (!action?.id) {
        utils.log('Not found user data.');
        return null;
    }

    action.pid = action.id;
    updateSettingsIds(action.id);
    return action;
}

/**
 * Handle regular user
 */
async function handleRegularUser(pid) {
    const action = await request_api.getNewScript(pid);

    // Skip phone verification for playlist creation
    if (systemConfig.client_config_use_recaptcha_for_login && action.script_code === 'create_playlist') {
        action.client_config_use_recaptcha_for_login = true;
    }

    return action;
}

/**
 * Setup proxy
 */
async function setupProxy(action, pid, isNewProxy) {
    if (!settings.useProxy) return true;

    if (isNewProxy) {
        await loadProxyForProfile(pid);
    }

    if (!proxy[pid]?.server) {
        console.log('Not found proxy');

        return false;
    }

    return await testProxyConnection(pid, action);
}

/**
 * Load proxy for profile
 */
async function loadProxyForProfile(pid) {
    const profile = await request_api.getInfoProfile(pid);

    if (profile?.proxy_server && profile?.proxy_username && profile?.proxy_password) {
        proxy[profile.id] = {
            server: profile.proxy_server,
            username: profile.proxy_username,
            password: profile.proxy_password,
        };
    } else {
        const proxyV6 = await request_api.getProfileProxy(pid, PLAYLIST_ACTION.WATCH, true);

        if (proxyV6?.server) {
            proxy[pid] = proxyV6;
        }
    }
}

/**
 * Test proxy connection
 */
async function testProxyConnection(pid, action) {
    try {
        await checkProxy(proxy[pid].server, proxy[pid].username, proxy[pid].password);

        return true;
    } catch (error) {
        console.log(error.code);

        const isConnectionRefused = error.code === 'ECONNREFUSED';

        if (isConnectionRefused) {
            console.log(`${proxy[pid].server} => Dead (Connection refused)`);

            await request_api.updateProfileData({
                pid: Number(pid),
                description: isConnectionRefused ? 'Loi Proxy' : '',
            });
        }

        return !isConnectionRefused;
    }
}

/**
 * Set default configuration for action
 */
function setDefaultConfig(action, pid) {
    if (pid) {
        addToRunningList(pid);
    }
    setBasicActionInfo(action, pid);
    copyClientConfigs(action);
    setActionData(action);
}

/**
 * Add to running list
 */
function addToRunningList(pid) {
    if (runnings.some((i) => i.pid == pid)) return;

    const startTime = Date.now();
    runnings.push({
        pid,
        start: startTime,
        lastReport: startTime,
        browser: true,
        action: 'watch',
    });
}

/**
 * Set basic action info
 */
function setBasicActionInfo(action, pid) {
    Object.assign(action, {
        delete_profile_after_run_script: systemConfig.delete_profile_after_run_script || false,
        id: action.script_code,
        pid,
        is_show_ui: IS_SHOW_UI,
        os_vm: process.env.OS,
    });

    if (settings.isRunBAT) action.isRunBAT = settings.isRunBAT;
    if (systemConfig.is_fb) action.is_fb = true;
    if (systemConfig.is_tiktok) action.is_tiktok = true;
}

/**
 * Copy client configs
 */
function copyClientConfigs(action) {
    Object.keys(systemConfig)
        .filter((key) => key.startsWith('client_config_'))
        .forEach((key) => (action[key] = systemConfig[key]));
}

/**
 * Set detailed action data
 */
function setActionData(action) {
    if (action.mobile_percent !== undefined && action.mobile_percent !== null) {
        return; // Already set
    }

    cleanupSystemConfig();
    Object.assign(action, systemConfig);
    delete action.systemParams;

    setMobileAndAdsPercent(action);
    setChannelData(action);
    setWatchActionData(action);
    setBrowserDataConfig(action);
}

/**
 * Cleanup system config
 */
function cleanupSystemConfig() {
    ['search_percent', 'direct_percent', 'suggest_percent', 'page_percent'].forEach((key) => delete systemConfig[key]);
}

/**
 * Set mobile and ads percent
 */
function setMobileAndAdsPercent(action) {
    action.mobile_percent = systemConfig.browser_mobile_percent;
    action.total_channel_created = Number(systemConfig.total_channel_created);

    const active_devices = systemConfig.active_devices || [];
    if (active_devices.length) {
        action.mobile_percent = 100;
    }

    if (systemConfig.ads_percent && !Number(action.ads_percent)) {
        action.ads_percent = systemConfig.ads_percent;
    }
}

/**
 * Set channel data
 */
function setChannelData(action) {
    const actionsNeedPosition = [
        'youtube_sub',
        'watch',
        'watch_video',
        'comment_youtube',
        'like_fb_page',
        'like_fb_post',
        'like_youtube',
    ];

    if (actionsNeedPosition.includes(action.id)) {
        const oldUserPosition = usersPosition.find((u) => u.pid == action.pid);
        action.channel_position = oldUserPosition ? Number(oldUserPosition.position) : -1;
    }
}

/**
 * Set watch action data
 */
function setWatchActionData(action) {
    if (action.id === 'watch' || action.id === 'watch_video') {
        action.total_loop_find_ads = systemConfig.total_loop_find_ads || 0;
        action.playlist_url = action.playlist_url || action.data;
        action.playlist_data = action.playlist_url;
    }
}

/**
 * Set browser data config
 */
function setBrowserDataConfig(action) {
    if (Number(systemConfig.is_clear_browser_data)) {
        action.is_clear_browser_data = true;
    }
}

/**
 * Update settings IDs list
 */
function updateSettingsIds(id) {
    settings.ids.push(id);
    settings.ids = [...new Set(settings.ids.map(String))];
}

module.exports = getScriptData;
