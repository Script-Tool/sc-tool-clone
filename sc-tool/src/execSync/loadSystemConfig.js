const fs = require("fs");
const execSync = require("child_process").execSync;
const request_api = require("../../request_api");
const getProfileIds = require("../profile/getProfileIds");
const settings = require("../settings");
const { closeChrome } = require("../browser/closeChrome");
const utils = require("../../utils");
const resetAllProfiles = require("../profile/resetAllProfiles");

async function loadSystemConfig() {
  let rs = await request_api.getSystemConfig();
  if (rs && !rs.error) {
    systemConfig = rs;
  }

  if (Number(systemConfig.max_current_profiles)) {
    settings.MAX_CURRENT_ACC = Number(systemConfig.max_current_profiles);
  }

  if (systemConfig.max_total_profiles) {
    settings.MAX_PROFILE = DEBUG
      ? 1
      : settings.MAX_CURRENT_ACC * Number(systemConfig.max_total_profiles);
  }

  // handle time change profile running
  const change_profile_time = Number(systemConfig.change_profile_time);
  if (
    settings.MAX_CURRENT_ACC == 1 &&
    change_profile_time &&
    change_profile_time != settings.current_change_profile_time
  ) {
    settings.current_change_profile_time = change_profile_time;
    if (settings.checkProfileTime) {
      clearInterval(settings.checkProfileTime);
    }
    changeProfile();
    settings.checkProfileTime = setInterval(() => {
      changeProfile();
    }, change_profile_time * 3600000);
  }

  if (DEBUG) {
    IS_SHOW_UI = true;
  } else {
    let newShowUIConfig = false;
    if (systemConfig.show_ui_config && systemConfig.show_ui_config != "false") {
      newShowUIConfig = true;
    }

    if (IS_SHOW_UI != newShowUIConfig) {
      if (IS_SHOW_UI != null) {
        settings.isSystemChecking = true;
        await handleForChangeShowUI();
        settings.isSystemChecking = false;
      }

      IS_SHOW_UI = newShowUIConfig;

      if (IS_SHOW_UI) {
        process.env.DISPLAY = ":0";
      }
    }
  }

  /**
   * Xử lý các trường hợp kháng mail, ver_mail, is_reg_account, is_reg_account_chatgpt.
   * Gọi api get-for-reg-channel để lấy thông tin
   */
  let IS_REG_USER_new =
    (systemConfig.is_reg_user && systemConfig.is_reg_user != "false") ||
    (systemConfig.is_ver_mail && systemConfig.is_ver_mail != "false") ||
    (systemConfig.is_rename_channel &&
      systemConfig.is_rename_channel != "false") ||
    (systemConfig.is_reg_account && systemConfig.is_reg_account != "false") ||
    (systemConfig.is_reg_account_chatgpt &&
      systemConfig.is_reg_account_chatgpt != "false") ||
    (systemConfig.is_reg_account_elevenlabs &&
      systemConfig.is_reg_account_elevenlabs != "false") ||
    (systemConfig.is_reg_account_murf &&
      systemConfig.is_reg_account_murf != "false") ||
    (systemConfig.is_reg_ga && systemConfig.is_reg_ga != "false") ||
    (systemConfig.is_check_mail_1 && systemConfig.is_check_mail_1 != "false") ||
    (systemConfig.is_change_pass && systemConfig.is_change_pass != "false") ||
    (systemConfig.is_recovery_mail &&
      systemConfig.is_recovery_mail != "false") ||
    (systemConfig.unsub_youtube && systemConfig.unsub_youtube != "false") ||
    systemConfig?.khanh_kenh_account;

  settings.IS_LOGIN =
    systemConfig?.is_login && systemConfig?.is_login != "false";

  if (IS_REG_USER_new != undefined && settings.IS_REG_USER != IS_REG_USER_new) {
    await resetAllProfiles();
    settings.IS_REG_USER = IS_REG_USER_new;
    if (settings.IS_REG_USER) {
      settings.EXPIRED_TIME = 300000;
    }
  }

  // khánh kênh
  if (systemConfig.channel_appeal || systemConfig.threeStepVerification) {
    settings.EXPIRED_TIME = 1500000;
  }

  if (DEBUG) {
    settings.EXPIRED_TIME = 600000;
  }
  // handle browsers for centos and ubuntu
  let browsers = [];
  if (systemConfig.browsers) {
    systemConfig.browsers.forEach((br) => {
      if (process.env.OS == "centos" || process.env.OS == "centos_vps") {
        if (br == "brave") {
          br = "brave-browser";
        }

        if (br == "microsoft-edge") {
          br = "microsoft-edge-stable";
        }

        if (br == "vivaldi-stable") {
          br = "vivaldi";
        }
        browsers.push(br);
      } else {
        if (br != "iridium-browser") {
          browsers.push(br);
        }
      }
    });
  } else {
    browsers = ["brave-browser"];
  }
  systemConfig.browsers = browsers;

  if (config.browser_map) {
    Object.keys(config.browser_map).forEach((browserMaped) => {
      if (!systemConfig.browsers.includes(browserMaped)) {
        config.browser_map[browserMaped].forEach((pid) => {
          closeChrome(pid);
          execSync("rm -rf profiles/" + pid);
        });
        delete config.browser_map[browserMaped];
      }
    });
  }

  if (systemConfig.stop_tool == 1) {
    execSync("pm2 stop all");
  }

  if (DEBUG) {
    systemConfig.is_stop = false;
  }

  if (systemConfig.not_allow_use_proxy) {
    settings.useProxy = false;
  }
}

function changeProfile() {
  if (!Array.isArray(config.profileTimeLog)) {
    config.profileTimeLog = [];
  }

  let currentIds = getProfileIds();
  config.profileTimeLog = config.profileTimeLog.filter((id) =>
    currentIds.includes(id)
  );
  let currentData = currentIds.filter(
    (id) => !config.profileTimeLog.includes(id)
  );
  currentData = [...currentData, ...config.profileTimeLog];
  const _profileRuning = currentData.shift();
  currentData.push(_profileRuning);
  settings.runningPid = _profileRuning;
  config.profileTimeLog = currentData;
  fs.writeFileSync("vm_log.json", JSON.stringify(config));
}

async function handleForChangeShowUI() {
  let _pids = getProfileIds();

  for await (let pid of _pids) {
    closeChrome(pid);
    await utils.sleep(2000);
  }
  await utils.sleep(2000);
  runnings = [];
  settings.ids = _pids;
}

module.exports = loadSystemConfig;
