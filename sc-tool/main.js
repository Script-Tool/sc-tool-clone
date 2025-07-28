// Import các module cần thiết
const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;
const utils = require("./utils");
// require("log-timestamp");
require("dotenv").config();
const { loadJson } = require("./src/execSync/loadJson");

// biến global
global.devJson = {
  hostIp: process.env.HOST_IP,
  maxProfile: Number(process.env.MAX_PROFILES) || 1,
};
global.IS_SHOW_UI = null;
global.IS_LOG_SCREEN = Boolean(Number(process.env.LOG_SCREEN));
global.DEBUG = Boolean(Number(process.env.DEBUG));

global.runnings = [];
global.usersPosition = [];
global.subRunnings = [];
global.addnewRunnings = [];
global.proxy = {};
global.gui = false;
global.WIN_ENV = process.platform === "win32";
global.fisrt_video = 0;
global.active_devices = [];
global.channelInfo = [];
global.config = loadJson("./vm_log.json");
global.workingDir = getScriptDir();
global.systemConfig = {};
global.youtubeProfile = {};

const request_api = require("./request_api");
// Import các hằng số từ file constants
const { ADDNEW_ACTION } = require("./src/constants");

// Các biến cấu hình
const settings = require("./src/settings");
settings.trace = loadJson("./trace_config.json");
let updateFlag = loadJson("./update_flag.json");

/*
 * các chức năng chính được tác ra rừ main
 */
const { closeChrome } = require("./src/browser/closeChrome");
const getProfileIds = require("./src/profile/getProfileIds");
const resetAllProfiles = require("./src/profile/resetAllProfiles");
const loadSystemConfig = require("./src/execSync/loadSystemConfig");
const initExpress = require("./src/api/initExpress");
const { getBrowserOfProfile } = require("./src/browser/getBrowserOfProfile");
const runUpdateVps = require("./src/execSync/runUpdateVps");
const startDisplay = require("./src/execSync/startDisplay");
const getScriptData = require("./src/api/getScriptData");
const handleAction = require("./src/execSync/handleAction");
const checkAndInstallBrave = require("./src/utils/checkAndInstallBrave");

/**
 * Thêm hành động mở trình duyệt vào hàng đợi hành động.
 * @param {*} action
 * @param {*} browser
 */
function addOpenBrowserAction(action, browser) {
  settings.actionsData.push({
    action: "OPEN_BROWSER",
    data: action,
    browser: browser,
  });
}

/**
 * Thực thi hành động từ hàng đợi hành động, xử lý một hành động tại một thời điểm.
 */
async function execActionsRunning() {
  if (settings.actionsData.length) {
    let action = settings.actionsData.shift();
    await handleAction(action);
  }
  await utils.sleep(1000);
  execActionsRunning();
}

/**
 * Khởi tạo và chạy ứng dụng. Bao gồm việc kiểm tra và cập nhật cài đặt, khởi tạo các thư mục cần thiết, khởi động máy chủ Express, và quản lý quá trình chạy.
 */
async function profileRunningManage() {
  try {
    if (!settings.isSystemChecking) {
      await checkRunningProfiles();
      await loadSystemConfig();

      /**
       * Kiểm tra và cập nhập trình duyệt mới
       */
      if (systemConfig.is_stop && systemConfig.is_stop != "false") {
        if (systemConfig.update_browser_brave) {
          await checkAndInstallBrave(systemConfig.link_brave);
        }
        return;
      }

      if (settings.MAX_CURRENT_ACC > runnings.length) {
        let currentIds = getProfileIds();
        settings.ids = settings.ids.filter((id) => {
          return currentIds.some((cid) => cid == id);
        });

        currentIds.forEach((cID) => {
          if (!settings.ids.some((cid) => cid == cID)) {
            settings.ids.push(cID);
          }
        });

        if (runnings.some((running) => running.action == "login")) {
          return;
        }

        if (
          settings.ids.length < settings.MAX_PROFILE &&
          !settings.IS_REG_USER &&
          settings.IS_LOGIN
        ) {
          newProfileManage();
        } else {
          if (systemConfig.only_run_login) {
            // something
          } else {
            if (systemConfig.threeStepVerification) {
              execSync("rm -rf profiles");
            } else {
              newRunProfile();
            }
          }
        }
      }
    }
  } catch (e) {
    utils.log("profileRunningManage err: ", e);
  } finally {
    setTimeout(profileRunningManage, settings.RUNNING_CHECK_INTERVAL);
  }
}

/**
 * Xử lý việc đăng nhập vào Chrome cho một hồ sơ cụ thể, cấu hình các thiết lập liên quan.
 * @param {*} profile
 */
async function loginProfileChrome(profile) {
  try {
    try {
      execSync(`sudo xrandr -s 1600x1200`);
    } catch (error) {}

    let action = profile;
    action.pid = profile.id;
    action.id = "login";
    if (systemConfig.threeStepVerification) action.threeStepVerification = true;
    //chỉ login
    action.delete_profile_after_run_script =
      systemConfig.delete_profile_after_run_script || false;

    action.isNew = true;
    action.is_show_ui = IS_SHOW_UI;
    action.os_vm = process.env.OS;
    action.phone_country = systemConfig.phone_country;

    // Chỉ login lưu thông tin xong thoát không kiểm tra các thông tin khác
    if (
      systemConfig.channel_appeal ||
      systemConfig.changing_to_vietnamese_name
    ) {
      action.only_run_login = true;

      if (systemConfig.channel_appeal_content)
        action.channel_appeal_content = systemConfig.channel_appeal_content;
    }

    // handle log browser for profile
    if (systemConfig.scan_check_recovery) {
      action.scan_check_recovery = true;
    }

    if (!config.browser_map) {
      config.browser_map = {};
    }
    if (systemConfig.skip_pau_history) {
      action.skip_pau_history = true;
    }
    if (systemConfig.is_fb) {
      action.is_fb = true;
      if ((action.id = "login")) {
        action.info_description = systemConfig.client_config_fb_description;
        action.first_name = systemConfig.client_config_fb_fisrt_name;
        action.last_name = systemConfig.client_config_fb_last_name;
      }
    }
    if (systemConfig.is_tiktok) {
      action.is_tiktok = true;
    }

    Object.keys(systemConfig).forEach((key) => {
      if ((key + "").startsWith("client_config_")) {
        action[key] = systemConfig[key];
      }
    });

    if (systemConfig.total_page_created) {
      action.total_page_created = systemConfig.total_page_created;
    }

    if (systemConfig.allow_verify) {
      action.allow_verify = true;
    }

    systemConfig.browsers = utils.shuffleArray(systemConfig.browsers);
    let _browser = systemConfig.browsers[0];
    systemConfig.browsers.some((browser) => {
      if (!config.browser_map[browser]) {
        _browser = browser;
        return true;
      } else if (
        config.browser_map[browser].length < config.browser_map[_browser].length
      ) {
        _browser = browser;
      }
    });

    if (!config.browser_map[_browser]) {
      config.browser_map[_browser] = [];
    }
    if (!config.browser_map[_browser].includes(action.pid)) {
      config.browser_map[_browser].push(action.pid);
    }
    fs.writeFileSync("vm_log.json", JSON.stringify(config));

    action.enableBAT = true;

    addOpenBrowserAction(action, _browser);
  } catch (e) {
    utils.log("error", "loginProfile", profile.id, e);
  }
}

/**
 * Quản lý việc tạo hồ sơ mới, bao gồm lấy hồ sơ từ API và cấu hình cho hồ sơ đó.
 */
async function newProfileManage() {
  try {
    const idsGet = getProfileIds();
    systemConfig.browsers.forEach((browser) => {
      if (config.browser_map[browser]) {
        config.browser_map[browser] = config.browser_map[browser].filter(
          (pid) => idsGet.some((id) => id == pid)
        );
      }
    });

    // get new profile
    let newProfile = await request_api.getNewProfile();
    if (!newProfile.err && newProfile?.profile?.id) {
      settings.RUNNING_CHECK_INTERVAL = 20000;
      // copy main to clone profile
      let profile = newProfile.profile;

      if (proxy && settings.useProxy) {
        if (
          profile.proxy_server &&
          profile.proxy_username &&
          profile.proxy_password
        ) {
          proxy[profile.id] = {
            server: profile.proxy_server,
            username: profile.proxy_username,
            password: profile.proxy_password,
          };
        } else {
          proxy[profile.id] = await request_api.getProfileProxy(
            profile.id,
            ADDNEW_ACTION
          );
        }
        console.log("pid", profile.id, "proxy", proxy[profile.id]);
        if (!proxy[profile.id]) {
          utils.log(
            "error",
            "pid:",
            profile.id,
            "get proxy:",
            proxy[profile.id]
          );
          await request_api.updateProfileStatus(
            profile.id,
            config.vm_id,
            "NEW"
          );
          return;
        }
      }

      runnings.push({
        action: "login",
        pid: profile.id,
        lastReport: Date.now(),
      });
      idsGet.push(profile.id);
      await loginProfileChrome(profile);
    } else {
      settings.RUNNING_CHECK_INTERVAL = utils.randomRanger(180000, 300000);
    }
  } catch (e) {
    utils.log("newProfileManage err: ", e);
  }
}

/**
 * Xử lý việc chạy hồ sơ mới, bao gồm việc lấy dữ liệu hồ sơ và thực hiện hành động mở trình duyệt.
 */
async function newRunProfile() {
  /**
   * Xử lý trường hợp bình thường
   */
  let pid;
  if (settings.runningPid) {
    let indexOfPid = settings.ids.indexOf(settings.runningPid);
    if (indexOfPid > -1) {
      pid = settings.ids[indexOfPid];
      settings.ids.splice(indexOfPid, 1);
    }
  }
  if (!pid) {
    pid = settings.ids.shift();
  }

  /**
   * Xử lý các trường họp IS_REG_USER
   */
  if (pid || settings.IS_REG_USER) {
    if (pid) {
      // handle remove undefined folder
      if (pid == "undefined" && !settings.IS_REG_USER) {
        try {
          execSync("rm -rf profiles/undefined");
        } catch (error) {}
        return;
      }

      let currentIds = getProfileIds();
      currentIds = currentIds.filter((cid) => cid != pid);
      if (currentIds.length > settings.MAX_PROFILE - 1) {
        currentIds.splice(0, settings.MAX_PROFILE - 1);
        currentIds.forEach((id) => {
          try {
            if (id != pid) {
              closeChrome(id);
              execSync("rm -rf profiles/" + id);
              settings.ids = settings.ids.filter((_id) => _id != id);
              runnings = runnings.filter((r) => r.pid != id);
            }
          } catch (error) {}
        });
      }
      settings.ids.push(pid);
    } else if (
      systemConfig.is_reg_account &&
      systemConfig.is_reg_account != "false"
    ) {
      pid = Math.floor(Math.random() * 5000);
    } else if (
      systemConfig.is_reg_account_chatgpt &&
      systemConfig.is_reg_account_chatgpt != "false"
    ) {
      pid = Math.floor(Math.random() * 5000);
    } else if (
      systemConfig.is_reg_account_elevenlabs &&
      systemConfig.is_reg_account_elevenlabs != "false"
    ) {
      pid = Math.floor(Math.random() * 5000);
    } else if (
      systemConfig.is_reg_account_murf &&
      systemConfig.is_reg_account_murf != "false"
    ) {
      pid = Math.floor(Math.random() * 5000);
    }

    /**
     * Cập nhập lại action nếu là IS_REG_USER
     */
    try {
      let action = await getScriptData(pid, true);

      if (!action || action.not_found || !action.script_code) {
        await utils.sleep(5000);
        runnings = runnings.filter((i) => i.pid != pid);
      }

      if (action && action.script_code) {
        // handle get browser loged
        let _browser = getBrowserOfProfile(pid);

        addOpenBrowserAction(action, _browser);
      }
    } catch (e) {
      utils.log("Run profile error: ", e);
    }
  } else {
    await getScriptData("", true);
  }
}

/**
 * Kiểm tra các hồ sơ đang chạy, xử lý việc đóng Chrome và xoá hồ sơ nếu thời gian chạy quá hạn.
 */
async function checkRunningProfiles() {
  try {
    if (settings.isPauseAction) {
      return;
    }
    utils.log("runnings: ", runnings.length);
    let watchingLength = runnings.length;
    for (let i = 0; i < watchingLength; i++) {
      // calculate last report time
      let timeDiff = Date.now() - runnings[i].lastReport;

      if (timeDiff > settings.EXPIRED_TIME) {
        let pid = runnings[i].pid;
        console.log("----- expired time -----", pid);
        try {
          closeChrome(pid);

          if (runnings[i].action == "login" || settings.IS_REG_USER) {
            execSync("sudo rm -rf profiles/" + pid);
            settings.ids = settings.ids.filter((id) => id != pid);

            if (settings.IS_REG_USER) {
              request_api.updateProfileData({
                pid: pid,
                status: "NEW",
                description: "Lỗi Reg",
              });
            }
          }
        } catch (e) {
        } finally {
          // delete in watching queue
          runnings = runnings.filter((x) => x.pid != pid);
          watchingLength -= 1;
          i -= 1;
        }
      }
    }
  } catch (e) {
    utils.log("error", "checkWatchingProfile err: ", e);
  }
}

/**
 * Cập nhật trạng thái của máy ảo, bao gồm thông báo về các hồ sơ đang chạy và xử lý các yêu cầu như xoá hoặc reset hồ sơ.
 */
async function updateVmStatus() {
  try {
    await loadSystemConfig();
    let _pids = getProfileIds();
    let pids = _pids.join(",");
    let rs = await request_api.reportVM({
      vm_id: config.vm_id,
      vm_name: config.vm_name,
      running: runnings.length,
      pids,
      IP: settings.IP,
    });

    if (rs && rs.removePid) {
      let removePID = Number(rs.removePid);
      closeChrome(removePID);
      await utils.sleep(5000);
      runnings = runnings.filter((i) => i.pid != removePID);
      settings.ids = settings.ids.filter((i) => i != removePID);
      try {
        await request_api.updateProfileData({
          pid: Number(removePID),
          status: rs?.removeType,
        });
        execSync("rm -rf profiles/" + removePID);
      } catch (error) {
        console.log("looxi  xoas ", error);
      }
    }

    if (rs && rs.reset_all_profiles) {
      await resetAllProfiles();
    }
  } catch (e) {
    utils.log("updateVmStatus err: ", e);
  } finally {
    setTimeout(updateVmStatus, 290000);
  }
}

/**
 * Quản lý hồ sơ, bao gồm cập nhật trạng thái của máy ảo và quản lý việc chạy hồ sơ.
 */
async function profileManage() {
  try {
    updateVmStatus();
    profileRunningManage();
  } catch (e) {
    utils.log("error", "profileManage:", e);
  }
}

/**
 * Chạy quá trình quản lý hồ sơ, khởi động lại máy ảo tự động, và thiết lập màn hình cho từng hồ sơ.
 */
async function running() {
  try {
    execSync(`sudo xrandr -s 1600x1200`);
  } catch (error) {}

  // get profile settings.ids
  if (!fs.existsSync("profiles")) {
    fs.mkdirSync("profiles");
  }

  settings.ids = getProfileIds();
  utils.log("settings.ids: ", settings.ids);
  settings.ids.forEach((pid) => startDisplay(pid));

  runAutoRebootVm();
  // manage profile actions
  await profileManage();
}

/**
 * Khởi tạo các thư mục cần thiết cho ứng dụng.
 */
function initDir() {
  if (!fs.existsSync(path.resolve("logscreen"))) {
    fs.mkdirSync(path.resolve("logscreen"));
  }

  if (!fs.existsSync("screen")) {
    fs.mkdirSync("screen");
  }

  if (!fs.existsSync("profiles")) {
    fs.mkdirSync("profiles");
  }

  if (!fs.existsSync("error")) {
    fs.mkdirSync("error");
  }
}
/**
 * Khởi tạo và chạy ứng dụng. Bao gồm việc kiểm tra và cập nhật cài đặt, khởi tạo các thư mục cần thiết, khởi động máy chủ Express, và quản lý quá trình chạy.
 */
async function start() {
  try {
    if (updateFlag && updateFlag.updating) {
      settings.isAfterReboot = true;
      await request_api.reportUpgrade();
      execSync("rm -rf update_flag.json");
      await utils.sleep(180000);
    }
    checkToUpdate();
    execActionsRunning();
    initDir();
    await initConfig();
    initExpress();
    running();
  } catch (e) {
    utils.log("error", "start:", e);
  } finally {
    let cleanup = async function () {
      utils.log("cleanup");
      closeChrome();
      process.exit();
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
}

/**
 *
 * @param {Tạo một ID ngẫu nhiên với độ dài xác định.} length
 * @returns string
 */
function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * Khởi tạo cấu hình, bao gồm đặt tên và ID cho máy ảo, địa chỉ IP, và tải cấu hình hệ thống.
 */
async function initConfig() {
  if (process.env.VM_NAME && process.env.VM_NAME != "_VM_NAME") {
    config.vm_name = process.env.VM_NAME;
  } else {
    config.vm_name = "DEFAULT_PC";
  }

  if (!config.vm_id) {
    config.vm_id = makeid(10);
  }

  settings.IP = config.vm_name;

  if (!config.browser_map) {
    config.browser_map = {};
  }

  if (config.usersPosition) {
    usersPosition = config.usersPosition;
  }

  fs.writeFileSync("vm_log.json", JSON.stringify(config));

  await loadSystemConfig();
}

/*
 * Lấy đường dẫn thư mục của script.
 */
function getScriptDir() {
  utils.log("__dirname: " + __dirname);
  return __dirname;
}

/**
 * Tự động khởi động lại máy ảo theo lịch trình cấu hình, cũng như reset hồ sơ nếu cần.
 */
function runAutoRebootVm() {
  setInterval(async () => {
    let myDate = new Date();
    let hour = Number(
      myDate
        .toLocaleTimeString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false,
        })
        .split(":")[0]
    );

    let resetProfilesTimeInterval = Number(
      systemConfig.reset_profiles_time_interval
    );
    if (resetProfilesTimeInterval && hour % resetProfilesTimeInterval == 0) {
      await resetAllProfiles();
    }

    if (
      Number(systemConfig.reset_system_time) > 0 &&
      hour == Number(systemConfig.reset_system_time)
    ) {
      try {
        settings.isSystemChecking = true;
        if (
          systemConfig.reset_profile_when_reset_system &&
          systemConfig.reset_profile_when_reset_system != "false"
        ) {
          await resetAllProfiles();
        }
        execSync("sudo systemctl reboot");
      } catch (error) {
        settings.isSystemChecking = false;
      }
    }
  }, 3600000);
}

/**
 * Kiểm tra và xử lý việc cập nhật công cụ, bao gồm reset hồ sơ và cập nhật công cụ.
 */
async function handleCheckUpdate() {
  try {
    const result = await request_api.checkToUpdate();

    if (result?.resetAllItem) {
      await resetAllProfiles();
    }

    if (result?.upgradeTool) {
      runUpdateVps();
    }
  } catch (e) {
    utils.log("check to update err: ", e);
  }
}

function checkToUpdate() {
  handleCheckUpdate();
  setInterval(handleCheckUpdate, 60000);
}

// Khởi chạy ứng dụng
start();
