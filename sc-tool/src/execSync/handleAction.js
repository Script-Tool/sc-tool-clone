const path = require('path');
const request_api = require('../../request_api');
const utils = require('../../utils');
const settings = require('../settings');
const setDisplay = require('./setDisplay');
const execSync = require('child_process').execSync;
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

const { spawn } = require('child_process');
const request = require('request-promise');
const fs = require('fs');
const del = require('del');
const { PLAYLIST_ACTION } = require('../constants');
const startChromeAction = require('../browser/startChromeAction');
const clipboardy = require('clipboardy');
const loginFacebookAction = require('./loginFacebookAction');

const robot = require('robotjs');
const createVideo = require('../utils/createVideo');
const textToSpeech = require('../ai/text-to-speed');
const { generateAndDownloadImage, downloadImage } = require('../ai/generate-image');
const downloadFile = require('../utils/downloadFile');
const downloadMP3 = require('../utils/downloadMP3');
const { uploadfile } = require('../api/driveAPI');
const cleanupDirectory = require('../utils/deleteAllFile');
const os = require('os');
const currentUser = os.userInfo().username;

// Hàm chính xử lý các hành động
async function handleAction(actionData) {
    if (settings.isPauseAction) {
        res.send({ rs: 'ok' });
        return;
    }

    setDisplay(actionData.pid);
    await utils.sleep(1000);

    let logStr = '---> ';
    if (actionData.x) {
        logStr += '-' + actionData.x + '-' + actionData.y;
    }
    utils.log(logStr);

    // copy str
    if (actionData.str) {
        try {
            if (actionData.str == 'none') {
                actionData.str = '';
            }
            clipboardy.writeSync(actionData.str);
        } catch (error) {
            utils.log('----error:', error);
        }
    }

    if (actionData.action == 'PASTE_IMAGE') {
        execSync(`xdotool mousemove ${actionData.x} ${actionData.y} && xdotool click 1`);
        let filePath = await getImagePathByName(actionData.str);

        try {
            if (filePath) {
                copyImageToClipboard(filePath);
                execSync(`xdotool sleep 2`);
                execSync(`xdotool key Control_L+v`);
            }
        } catch (error) {
            utils.error(`Lỗi xclip: ${error.message}`);
        }
    } else if (actionData.action == 'DRAG') {
        let xTarget = Number(actionData.x) + Number(actionData.sx);
        let yTarget = Number(actionData.sy);

        execSync(`xdotool mousemove ${actionData.x} ${actionData.y}`);
        execSync(`xdotool mousedown 1`);
        execSync(`xdotool mousemove ${xTarget / 2} ${yTarget}`);
        await utils.sleep(2000);
        execSync(`xdotool mousemove ${xTarget + 10} ${yTarget}`);
        execSync(`xdotool mousemove ${xTarget + 5} ${yTarget}`);
        execSync(`xdotool mousemove ${xTarget + -5} ${yTarget}`);
        execSync(`xdotool mousemove ${xTarget + 2} ${yTarget}`);

        execSync(`xdotool mouseup 1`);
    } else if (actionData.action == 'SELECT_AVATAR') {
        /**
         * Tải và lưu ảnh avatar
         **/
        try {
            await utils.sleep(5000);

            let imageName = actionData.str || 'avatar.jpg';

            let avatar = await request_api.getAvatarByName(imageName);

            if (true && avatar) {
                await utils.sleep(5000);
                utils.log('Lick start');
                execSync(`xdotool mousemove 319 134 && sleep 1 && xdotool click 1 && sleep 2`);
                execSync(
                    `xdotool mousemove 623 158 && sleep 1 && xdotool click 1 && xdotool click 1 && xdotool click 1 && sleep 1`,
                );
                utils.log('Lick end');
            } else {
                execSync(`xdotool key Escape`);
            }
        } catch (error) {
            utils.log('error', error);
        }
    } else if (actionData.action == 'OPEN_BROWSER') {
        await startChromeAction(actionData.data, actionData.browser);
    } else if (actionData.action == 'BRAVE_SETTINGS') {
        execSync(`xdotool key Shift+Tab`); //1

        execSync(`xdotool key Shift+Tab`); //2

        execSync(`xdotool key Shift+Tab`); //3

        execSync(`xdotool key Shift+Tab`); //4

        execSync(`xdotool key Shift+Tab`); //5

        execSync(`xdotool key Shift+Tab`); //6

        execSync(`xdotool key Shift+Tab`); //7

        execSync(`xdotool key Shift+Tab`); //8

        execSync(`xdotool key Shift+Tab`); //9

        execSync(`xdotool key Shift+Tab`); //10

        execSync(`xdotool key Shift+Tab`); //11

        execSync(`xdotool key Shift+Tab`); //12
        // Brave Release v1.59.111
        execSync(`xdotool key Up`);

        execSync(`xdotool key Shift+Tab`); //13

        execSync(`xdotool key Shift+Tab`); //14

        execSync(`xdotool key Shift+Tab`); //15

        execSync(`xdotool key Shift+Tab`); //16

        execSync(`xdotool key Shift+Tab`); //17
        execSync(`xdotool key Return`);

        execSync(`xdotool key Shift+Tab`); //19

        execSync(`xdotool key Up`);

        execSync(`xdotool key Up`);

        execSync(`xdotool key Up`);

        execSync(`xdotool key Shift+Tab`); //19

        execSync(`xdotool key Shift+Tab`); //20

        execSync(`xdotool key Shift+Tab`); //21

        execSync(`xdotool key Shift+Tab`); //22
        // Brave Release v1.64.111
        execSync(`xdotool key Shift+Tab`); // 23
        execSync(`xdotool key Up`);

        // Brave Release v1.64.111
        // execSync(`xdotool key Shift+Tab`); // 24
        // execSync(`xdotool key Up`);

        execSync(`xdotool key Up`);
    } else if (actionData.action == 'IRIDIUM_SETTING') {
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Up`);
        execSync(`xdotool key Up`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key KP_Enter && sleep 1`);
    } else if (actionData.action == 'NO_ASK_BEFORE_DOWNLOADING_FILE_BRAVE') {
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Return`);
    } else if (actionData.action == 'DISABLE_OFFER_TO_SAVE_PASSWORDS') {
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Return`);
    } else if (actionData.action == 'CLOSE_BROWSER') {
        execSync(`xdotool key Control_L+w && sleep 1`);
    } else if (actionData.action == 'TABS') {
        let totalClick = Number(actionData.x);
        let count = 0;
        while (count < totalClick) {
            execSync(`xdotool key Tab && sleep 1`);
            count++;
        }
    } else if (actionData.action == 'TABS_ENTER') {
        let totalClick = Number(actionData.x);
        let count = 0;
        while (count < totalClick) {
            execSync(`xdotool key Tab && sleep 1`);
            count++;
        }
        execSync(`xdotool key KP_Enter && sleep 1`);
    } else if (actionData.action == 'SHOW_BRAVE_ADS') {
        execSync(`xdotool key Shift+Tab && sleep 1`);
        execSync(`xdotool key Shift+Tab && sleep 1`);
        execSync(`xdotool key KP_Enter && sleep 1`);
    } else if (actionData.action == 'COPY_BAT') {
        try {
            execSync(`xdotool key Control_L+c && sleep 1`);
        } catch (error) {}

        await utils.sleep(1000);

        let currentBat = '';
        const clipboardy = require('clipboardy');
        currentBat = clipboardy.readSync();
        utils.log('currentBat', currentBat);
        currentBat = Number(currentBat);

        if (currentBat) {
            try {
                let braveInfo = await request_api.getBraveInfo(actionData.pid);
                if (braveInfo) {
                    if (braveInfo.total_bat) {
                        if (!braveInfo.is_disabled_ads) {
                            if (braveInfo.total_bat == currentBat) {
                                request_api.updateProfileData({
                                    is_disabled_ads: true,
                                    pid: actionData.pid,
                                    count_brave_rounds: 0,
                                });
                                request_api.getProfileProxy(actionData.pid, PLAYLIST_ACTION.WATCH, true);
                                return res.send({ disable_ads: true });
                            }
                        } else {
                            if (braveInfo.count_brave_rounds >= braveInfo.brave_replay_ads_rounds) {
                                request_api.updateProfileData({
                                    is_disabled_ads: false,
                                    pid: actionData.pid,
                                });
                                return res.send({ enable_ads: true });
                            }
                        }
                    }
                }
                request_api.updateProfileData({
                    total_bat: currentBat,
                    pid: actionData.pid,
                    $inc: { count_brave_rounds: 1 },
                });
            } catch (error) {
                utils.log(error);
            }
        }
    } else if (actionData.action == 'ESC') {
        execSync(`xdotool key Escape && sleep 0.5`);
    } else if (actionData.action == 'GO_TO_FISRT_TAB') {
        execSync(`xdotool key Control_L+1 && sleep 1`);
    } else if (actionData.action == 'DOUBLE_CLICK') {
        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click 1 && xdotool click 1 && sleep 1`,
        );
    } else if (actionData.action == 'NEW_TAB') {
        try {
            execSync(`xdotool key Control_L+t && sleep 1`);
            utils.log('NEW_TAB ok');
        } catch (error) {
            utils.log('error NEW_TAB', error);
        }
    } else if (actionData.action == 'CLOSE_TAB') {
        try {
            execSync('xdotool key ctrl+w && sleep 1');
        } catch (error) {
            utils.log('error NEW_TAB', error);
        }
    } else if (actionData.action == 'RELOAD_PAGE') {
        execSync(`xdotool key F5 && sleep 1`);
    } else if (actionData.action == 'END_SCRIPT') {
        execSync(`xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click 1 && sleep 1`);
        await utils.sleep(5000);
        runnings = runnings.filter((i) => i.pid != actionData.pid);
    } else if (actionData.action == 'CTR_CLICK') {
        execSync(`xdotool mousemove ${actionData.x} ${actionData.y} && xdotool keydown Control_L && xdotool click 1`);
    } else if (actionData.action == 'CTR_DOWN') {
        execSync(`xdotool keydown Control_L`);
    } else if (actionData.action == 'CTR_UP') {
        execSync(`xdotool keyup Control_L`);
    } else if (actionData.action == 'CLICK') {
        if (actionData.x > 65) {
            try {
                execSync(`xdotool mousemove ${actionData.x} ${actionData.y}`);
                execSync(`sleep 1`);
                execSync(`xdotool click 1`);
            } catch (error) {
                utils.error('Lỗi khi thực hiện lệnh action == "CLICK":', error);
            }
        }
    } else if (actionData.action == 'TYPE') {
        let repeat = 3;
        if (actionData.selector == 'input_post_fb') {
            repeat = 2;
        }

        if (actionData?.str?.includes('[audio]')) {
            const result = actionData.str.split(':');
            const currentContent = Number(result[1]);
            const contentList = settings.action.contentList;
            const content = `Please repeat the following text exactly as it is, without adding any explanations, comments, or additional content. Do not change the format, language, or content. Skip any information about character count or completion notices at the end of the text (such as "Current Part Characters", "Total Characters", "CREATIVE STORY COMPLETED"). End each sentence in the text with a line break. This is the text: ${contentList[currentContent]}`;
            clipboardy.writeSync(content);
        } else if (actionData?.str?.includes('[image]')) {
            const result = actionData.str.split(':');

            if (result[2] === 'story') {
                const currentScene = Number(result[1]);

                const scenes = settings.action.scenes;
                const image_prompt = `${scenes[currentScene].image_prompt[0]}`;
                clipboardy.writeSync(image_prompt);
            } else {
                const currentThumbnail = Number(result[1]);

                const thumbnailsText = settings.action.thumbnailsText;
                // const thumbnail = `Tạo một bức ảnh dựa trên mô tả sau: ${thumbnailsText[currentThumbnail]}`;
                const thumbnail = `${thumbnailsText[currentThumbnail]}`;
                clipboardy.writeSync(thumbnail);
            }
        }
        // && xdotool key Control_L+a
        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click --repeat ${repeat} 1 && sleep 1 && sleep 1 && xdotool key Control_L+v && sleep 1`,
        );
    } else if (actionData.action == 'TYPE_CHAR') {
        let repeat = 3;
        // Di chuyển chuột & focus vào input
        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click --repeat ${repeat} 1 && sleep 1`,
        );

        // Xóa dữ liệu cũ (Chọn tất cả và xóa)
        execSync(`xdotool key Control_L+a && sleep 0.5 && xdotool key BackSpace`);

        // Nhập từng ký tự
        for (const char of actionData.str) {
            execSync(`xdotool key ${char}`);
            execSync(`sleep 0.2`); // Chờ một chút để tránh lỗi nhập quá nhanh
        }
    } else if (actionData.action == 'ONLY_TYPE_CHAR') {
        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click --repeat 1 1 && sleep 1`,
        );

        // Xóa dữ liệu cũ (Chọn tất cả và xóa)
        execSync(`xdotool key Control_L+a && sleep 0.5 && xdotool key BackSpace`);

        const keySequence = actionData.str.split('').map((char) => char.replace(/:/g, 'colon').replace(/ /g, 'space'));

        // Nhập từng ký tự
        for (const char of keySequence) {
            execSync(`xdotool key ${char}`);
            execSync(`sleep 0.2`); // Chờ một chút để tránh lỗi nhập quá nhanh
        }
    } else if (actionData.action == 'KEY_ENTER') {
        execSync(`xdotool key KP_Enter && sleep 1`);
    } else if (actionData.action == 'TYPE_ENTER') {
        if (actionData?.str?.includes('[audio]')) {
            const result = actionData.str.split(':');
            const currentContent = Number(result[1]);
            const contentList = settings.action.contentList;
            const content = `Please repeat the following text exactly as it is, without adding any explanations, comments, or additional content. Do not change the format, language, or content. Skip any information about character count or completion notices at the end of the text (such as "Current Part Characters", "Total Characters", "CREATIVE STORY COMPLETED"). End each sentence in the text with a line break. This is the text: ${contentList[currentContent]}`;
            clipboardy.writeSync(content);
        } else if (actionData?.str?.includes('[image]')) {
            const result = actionData.str.split(':');

            if (settings.action?.sceneId) {
                const image_prompt = `${settings.action.thumbnailsText.join(' ')}`;
                clipboardy.writeSync(image_prompt);
            } else {
                const currentThumbnail = Number(result[1]);

                const thumbnailsText = settings.action.thumbnailsText;
                // const thumbnail = `Tạo một bức ảnh dựa trên mô tả sau: ${thumbnailsText[currentThumbnail]}`;
                const thumbnail = `${thumbnailsText[currentThumbnail]}`;
                clipboardy.writeSync(thumbnail);
            }
        }

        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click --repeat 3 1 && sleep 1 && xdotool key Control_L+v && sleep 3 && xdotool key KP_Enter && sleep 1`,
        );
    } else if (actionData.action == 'TYPE_KEY_ENTER') {
        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click 1 && sleep 1 && xdotool key E && xdotool key n && xdotool key g && sleep 1 && xdotool key KP_Enter && sleep 1`,
        );
    } else if (actionData.action == 'ONLY_TYPE') {
        execSync(`xdotool key Control_L+v sleep 1`);
    } else if (actionData.action == 'ONLY_TYPE_ENTER') {
        execSync(`xdotool key Control_L+v && sleep 3 && xdotool key KP_Enter && sleep 1`);
    } else if (actionData.action == 'CLICK_ENTER') {
        execSync(
            `xdotool mousemove ${actionData.x} ${actionData.y} && sleep 1 && xdotool click 1 && sleep 1 && xdotool key KP_Enter && sleep 1`,
        );
    } else if (actionData.action == 'NEXT_VIDEO') {
        execSync(`xdotool key Shift+n && sleep 1`);
    } else if (actionData.action == 'SCROLL') {
        if (actionData.str == 6) {
            execSync(`xdotool key Shift+Tab && sleep 1`);
            execSync(`xdotool key Page_Down && sleep 1`);
        } else {
            if (actionData.str > 0) {
                let pageNumber = Math.ceil(actionData.str / 5);
                while (pageNumber > 0) {
                    execSync(`xdotool key Page_Down && sleep 1`);
                    pageNumber--;
                }
            } else {
                let pageNumber = Math.ceil(actionData.str / -5);
                while (pageNumber > 0) {
                    execSync(`xdotool key Page_Up && sleep 1`);
                    pageNumber--;
                }
            }
        }
    } else if (actionData.action == 'SEND_KEY') {
        execSync(`xdotool type ${actionData.str}`);
    } else if (actionData.action == 'GO_ADDRESS') {
        try {
            execSync(`xdotool key Escape && sleep 0.5 && xdotool key Control_L+l && sleep 0.5`);
            if (actionData.str.length > 40) {
                execSync(`xdotool key Control_L+v`);
                await utils.sleep(2000);
            } else {
                execSync(`xdotool type "${actionData.str}"`);
            }
            await utils.sleep(1000);
            execSync(`xdotool key KP_Enter`);
            await utils.sleep(2000);
        } catch (error) {
            utils.log('error GO_ADDRESS', error);
        }
    } else if (actionData.action == 'OPEN_DEV') {
        execSync(
            `sleep 3;xdotool key Control_L+Shift+i;sleep 7;xdotool key Control_L+Shift+p;sleep 3;xdotool type "bottom";sleep 3;xdotool key KP_Enter`,
        );
    } else if (actionData.action == 'OPEN_MOBILE') {
        utils.log('open mobile simulator');
        let po = {
            0: 4,
            1: 5,
            2: 6,
            3: 7,
            4: 8,
            5: 9,
            6: 10,
            7: 11,
            8: 12,
            9: 12,
        };
        let devicePo = Number(active_devices[Number(actionData.pid) % active_devices.length]);
        devicePo -= 1;
        execSync(
            `xdotool key Control_L+Shift+m;sleep 2;xdotool mousemove 855 90;sleep 1;xdotool click 1;sleep 1;xdotool mousemove 855 ${
                150 + 24 * devicePo
            };sleep 1;xdotool click 1;sleep 1`,
        );
    } else if (actionData.action == 'OPEN_MOBILE_CUSTOM') {
        utils.log('add custom mobile');
        execSync(
            `xdotool key Control_L+Shift+m;sleep 2;xdotool key Control_L+Shift+p;sleep 1;xdotool type "show devices";sleep 1;xdotool key KP_Enter;sleep 1;xdotool key KP_Enter;xdotool type "custom";xdotool key Tab;xdotool type ${actionData.x};xdotool key Tab;xdotool type ${actionData.y};xdotool key Tab;xdotool key Tab;xdotool key Control_L+v;xdotool key Tab;xdotool key Tab;xdotool key KP_Enter;xdotool key Escape;xdotool mousemove 855 90;sleep 1;xdotool click 1;sleep 1;xdotool mousemove 855 150;sleep 1;xdotool click 1;sleep 1`,
        );
    } else if (actionData.action == 'REOPEN_MOBILE_CUSTOM') {
        utils.log('add custom mobile');
        execSync(
            `sleep 2;xdotool key Control_L+Shift+p;sleep 1;xdotool type "show devices";sleep 1;xdotool key KP_Enter;sleep 1;xdotool key KP_Enter;xdotool type "custom";xdotool key Tab;xdotool type ${actionData.x};xdotool key Tab;xdotool type ${actionData.y};xdotool key Tab;xdotool key Tab;xdotool key Control_L+v;xdotool key Tab;xdotool key Tab;xdotool key KP_Enter;xdotool key Escape;xdotool mousemove 855 90;sleep 1;xdotool click 1;sleep 1;xdotool mousemove 855 150;sleep 1;xdotool click 1;sleep 1`,
        );
    } else if (actionData.action == 'SELECT_MOBILE') {
        utils.log('open mobile simulator');
        let po = {
            0: 4,
            1: 5,
            2: 6,
            3: 7,
            4: 8,
            5: 9,
            6: 10,
            7: 11,
            8: 12,
            9: 12,
        };
        let devicePo = Number(active_devices[Number(actionData.pid) % active_devices.length]);
        devicePo -= 1;
        execSync(
            `xdotool mousemove 855 90;sleep 0.5;xdotool click 1;sleep 1;xdotool mousemove 855 ${
                150 + 24 * devicePo
            };sleep 0.5;xdotool click 1;sleep 1`,
        );
    } else if (actionData.action == 'SELECT_MOBILE_CUSTOM') {
        utils.log('open mobile simulator');
        execSync(
            `xdotool mousemove 855 90;sleep 0.5;xdotool click 1;sleep 1;xdotool mousemove 855 150;sleep 0.5;xdotool click 1;sleep 1`,
        );
    } else if (actionData.action == 'SHOW_PAGE') {
        execSync(
            `xdotool key Control_L+Shift+p;sleep 0.5;xdotool type "elements";sleep 0.5;xdotool key KP_Enter;sleep 0.5;xdotool key Control_L+Shift+p;sleep 0.5;xdotool type "search";sleep 0.5;xdotool key KP_Enter`,
        );
    } else if (actionData.action == 'SELECT_OPTION') {
        execSync(`xdotool key Page_Up && sleep 1`);
        for (let i = 0; i < actionData.str * 1; i++) {
            execSync(`xdotool key Down && sleep 0.2`);
        }
        execSync(`xdotool key KP_Enter`);
    } else if (actionData.action == 'SCREENSHOT') {
        utils.errorScreenshot(actionData.pid + '_input');
    } else if (actionData.action == 'MAP_STAR') {
        execSync(`xdotool key Tab && sleep 1`); //23
        execSync(`xdotool key Tab && sleep 1`); //23

        for (let index = 0; index < actionData.loop; index++) {
            execSync(`xdotool key Right && sleep 1`);
        }
    }
    if (actionData.action.includes('choose_')) {
        // Lấy tên quốc gia từ action, ví dụ: "choose_Russian" -> "Russian"
        const country = actionData.action.replace('choose_', '');
        if (country == 'unitedkingdom') {
            execSync('xdotool key Up');
            execSync('xdotool key Return');
        } else if (country == 'unitedstates') {
            const countryKeyArray = country.substring(0, 5).split('');
            countryKeyArray.forEach((key) => {
                execSync(`xdotool key ${key}`);
                execSync('sleep 0.5');
            });

            execSync('sleep 0.5');
            execSync('xdotool key Down');

            execSync('sleep 0.5');
            execSync('xdotool key Down');
            execSync('sleep 0.5');

            execSync('xdotool key Return');
        } else {
            const countryKeyArray = country.substring(0, 5).split('');

            countryKeyArray.forEach((key) => {
                execSync(`xdotool key ${key}`);
            });

            execSync('xdotool key Return');
        }
    } else if (actionData.action == 'BROWSER_GO_BACK') {
        execSync('xdotool key Alt+Left');
    } else if (actionData.action == 'BROWSER_GO_FORWARD') {
        execSync('xdotool key Alt+Right');
    } else if (actionData.action == 'SCROLL_TO_BOTTOM') {
        execSync('xdotool key End');
    } else if (actionData.action == 'DELETE_VALUE_INPUT') {
        execSync('xdotool click --repeat 2 1');
        execSync('xdotool key BackSpace');
    } else if (actionData.action == 'SHIFT_TAB_ENTER') {
        execSync(`xdotool key Shift+Tab`);
        execSync(`xdotool key Return`);
    } else if (actionData.action == 'VIVALDI_POPUP_DOWN') {
        execSync(`xdotool key Tab`);
        execSync(`xdotool key Return`);
    } else if (
        actionData.action == 'TryAnotherWay' ||
        actionData.action == 'AuthenticationApp' ||
        actionData.action == 'AlwaysConfirmItMe'
    ) {
        await loginFacebookAction(actionData.action);
    } else if (actionData.action === 'UP_VIDEO') {
        robot.setKeyboardDelay(500);
        await utils.sleep(2000);
        robot.moveMouse(380, 277);
        robot.mouseClick();
        await utils.sleep(2000);
        robot.moveMouse(555, 296);
        robot.mouseClick('left', true);
        await utils.sleep(5000);
    } else if (actionData.action == 'VIDEO_DELETE') {
        try {
            const videoPath = `/home/${currentUser}/sc-tool/ex/videos/a1.mp4`;

            // Xóa file
            fs.unlink(videoPath, (err) => {
                if (err) {
                    console.error(`Lỗi khi xóa file: ${err}`);
                    return;
                }
            });
        } catch (error) {
            console.log('error');
        }
    } else if (actionData.action === 'CREATE_VIDEO') {
        // Các tham số đầu vào
        const imagePath = `/home/${currentUser}`; // Đường dẫn tới ảnh
        const audioPath = `/home/${currentUser}`; // Đường dẫn tới tệp âm thanh
        const outputPath = `/home/${currentUser}/sc-tool/ex/videos/a1.mp4`; // Đường dẫn để lưu video đầu ra

        const videoPaths = [];
        try {
            for (const [index, content] of youtubeContent.contents.entries()) {
                const genImage = await generateAndDownloadImage(content.image, `${imagePath}/image${index + 1}.png`);
                const genAudio = await createVideo.processLargeTextFile(
                    content.content,
                    `${audioPath}/audio${index + 1}.mp3`,
                    'alloy', // Other options: alloy, echo, fable, onyx, nova, shimmer
                );
                const duration = await createVideo.getAudioDuration(`${audioPath}/audio${index + 1}.mp3`);
                await createVideo.createVideoFromImageAndAudio(
                    `${imagePath}/image${index + 1}.png`,
                    `${audioPath}/audio${index + 1}.mp3`,
                    `/home/${currentUser}/video${index + 1}.mp4`,
                    duration,
                );
                videoPaths.push(`/home/${currentUser}/video${index + 1}.mp4`);
            }

            await createVideo.mergeVideos(videoPaths, outputPath);
        } catch (error) {
            console.error('Failed to create audio:', error);
        }
        // Gọi hàm tạo video
    } else if (actionData.action === 'LOG') {
        console.log(...JSON.parse(actionData.str));
    } else if (actionData.action === 'LOGIN_GOOGLE') {
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Tab && sleep 1`);
        execSync(`xdotool key Return && sleep 1`);
    } else if (actionData.action == 'LOGIN_GOOGLE_FA_CODE') {
        execSync(`xdotool type ${actionData.str}`);
    } else if (actionData.action === 'DOWNLOAD_AUDIO') {
        const parts = actionData.str.split('*');
        const name = 'audio' + parts[0] + '.mp3';
        const link = parts[1];
        downloadMP3(link, name);
    } else if (actionData.action === 'MOUSE_MOVE_SCROLL') {
        execSync(`xdotool mousemove ${actionData.x} ${actionData.y} && xdotool click 5 `);
    } else if (actionData.action === 'KEY_RETURN') {
        execSync(`xdotool key Enter`);
    } else if (actionData.action === 'COPY_IMAGE') {
        execSync('xdotool click 3');
        execSync('sleep 0.5');

        // Nhấn mũi tên xuống 3 lần
        execSync('xdotool key --repeat 3 Down');

        // Đợi một chút
        execSync('sleep 0.5');

        // Nhấn Enter
        execSync('xdotool key Return');

        execSync('sleep 1');
        await handleImageCopy();
    } else if (actionData.action == 'CLOUDFLARE') {
        // Thay YOUR_ACTION_NAME bằng tên action của bạn, ví dụ "PRESS_TAB_SPACE"
        execSync(`xdotool key Tab+space`); // Hoặc 'xdotool key Tab Space' tùy cách xdotool diễn giải
    }

    if (actionData.res) {
        actionData.res.json({ success: true });
    }

    utils.log('end action', actionData.action);
}

module.exports = handleAction;

// Lắng nghe sự kiện copy
async function handleImageCopy() {
    try {
        execSync('xclip -selection clipboard -t image/png -o > download/image.png');
    } catch (error) {
        console.error('Lỗi khi xử lý clipboard:', error);
    }
}

async function getImagePathByName(image_name) {
    try {
        let fileName = 'image.jpg'; // Sử dụng date now để tạo tên file duy nhất
        let fimg = await request_api.getImageByName(image_name);

        if (fimg && Buffer.isBuffer(fimg)) {
            // Kiểm tra fimg có phải là buffer
            const imagePath = path.resolve('./images', fileName); // Đường dẫn đầy đủ

            if (!fs.existsSync('./images')) {
                fs.mkdirSync('images');
            }

            const fd = fs.openSync(imagePath, 'w'); // Mở file để ghi
            fs.writeSync(fd, fimg); // Ghi buffer vào file
            fs.closeSync(fd); // Đóng file

            return imagePath;
        } else {
            utils.error('Lỗi: Không nhận được dữ liệu ảnh hợp lệ');
            return null; // Trả về null để biểu thị lỗi
        }
    } catch (error) {
        utils.error('Lỗi:', error.message, error.stack); // In thông tin lỗi chi tiết
        return null;
    }
}
function copyImageToClipboard(imagePath) {
    const command = `xclip -selection clipboard -t image/png -i ${imagePath}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            utils.error(`Lỗi khi sao chép ảnh: ${error}`);
            return;
        }
        utils.log('Ảnh đã được sao chép vào clipboard.');
    });
}

// Chuyển đổi các file .ogg sang .mp3 sử dụng Promise để đợi hoàn thành
const convertOggToMp3 = async (audioFiles, downloadDir) => {
    const mp3Files = [];
    const conversionPromises = audioFiles.map((audioFile, i) => {
        try {
            return new Promise((resolve, reject) => {
                const outputMp3 = path.join(downloadDir, `audio${i + 1}.mp3`);

                ffmpeg(audioFile)
                    .outputOptions('-acodec', 'libmp3lame')
                    .output(outputMp3)
                    .on('error', (err) => {
                        console.error(`Lỗi khi chuyển đổi file ${audioFile}: ${err.message}`);
                        reject(err);
                    })
                    .on('end', () => {
                        mp3Files.push(outputMp3);
                        resolve(outputMp3);
                    })
                    .run();
            });
        } catch (error) {
            console.log('convertOggToMp3', error);
        }
    });

    // Đợi tất cả các quá trình chuyển đổi hoàn thành
    await Promise.all(conversionPromises);

    // Sắp xếp lại các file mp3 theo thứ tự đúng
    mp3Files.sort((a, b) => {
        const numA = parseInt(path.basename(a).replace('audio', '').replace('.mp3', ''));
        const numB = parseInt(path.basename(b).replace('audio', '').replace('.mp3', ''));
        return numA - numB;
    });

    return mp3Files;
};
