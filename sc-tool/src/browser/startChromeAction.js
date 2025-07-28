const path = require("path");
const utils = require("../../utils");
const sendEnter = require("../execSync/sendEnter");
const setDisplay = require("../execSync/setDisplay");
const startDisplay = require("../execSync/startDisplay");
const settings = require("../settings");
const { closeChrome } = require("./closeChrome");
const { LOCAL_PORT } = require("../constants");
const exec = require("child_process").exec;
const fs = require("fs");
const { spawn } = require("child_process");

/**
 * Hàm khởi động hành động Chrome
 * @param {Object} action - Dữ liệu hành động
 * @param {string} _browser - Tên trình duyệt
 */
async function startChromeAction(action, _browser) {
  try {
    let params = "";
    if (systemConfig.systemParams) {
      let ss = systemConfig.systemParams.split("##");
      if (ss.length) {
        let index = utils.getRndInteger(0, ss.length - 1);
        params = ss[index];

        try {
          params = params.replace("\\n", "");
          const ramdom1 = utils.getRndInteger(1000, 9000);
          const ramdom2 = utils.getRndInteger(1000, 9000);
          params = params.replace(
            "123456789",
            `173493304458${ramdom2}${ramdom1}`
          );
        } catch (error) {
          utils.log(error);
        }
      }
    }

    if (systemConfig.is_setting_brave) {
      action.is_setting_brave = true;
    }

    let widthSizes = [950, 1100, 1200];
    let positionSize = action.isNew ? 0 : utils.getRndInteger(0, 2);
    let screenWidth = 1400;
    let screenHeight = 950;

    // Xử lý userDataDir
    let userDataDir = `--user-data-dir=${path.resolve(
      "profiles",
      action.pid + ""
    )}`;

    // Xử lý kích thước trình duyệt
    action["positionSize"] = positionSize;
    action["screenWidth"] = screenWidth;
    action["screenHeight"] = screenHeight;
    let windowPosition = "--window-position=0,0";
    let windowSize = `--window-size=${screenWidth},${screenHeight}`;

    // Xử lý trường hợp đặc biệt cho Brave Browser
    if (
      _browser == "brave-browser" &&
      action.id == "reg_account" &&
      !IS_SHOW_UI
    ) {
      screenWidth = 1400;
      windowSize = `--window-size=${screenWidth},${screenHeight}`;
    } else if (
      _browser == "brave-browser" &&
      action.id == "login" &&
      !IS_SHOW_UI
    ) {
      screenWidth = 1400;
    } else {
      if (IS_SHOW_UI) {
        windowSize = "--start-maximized";
        windowPosition = "";
      }
    }

    // Xử lý proxy
    let userProxy = [];

    if (proxy && proxy[action.pid] && proxy[action.pid].server) {
      console.log("set proxy", proxy[action.pid]);
      userProxy = [
        `--proxy-server=${proxy[action.pid].server}`,
        `--proxy-bypass-list=story-shack-cdn-v2.glitch.me,randomuser.me,random-data-api.com,localhost:2000,${devJson.hostIp}`,
      ];
    }
    if (proxy && proxy[action.pid] && proxy[action.pid].username) {
      utils.log("set proxy user name", proxy[action.pid].username);
      action.proxy_server = proxy[action.pid].server;
      action.proxy_username = proxy[action.pid].username;
      action.proxy_password = proxy[action.pid].password;
    }

    if (!settings.useProxy) {
      userProxy = [];
    }

    // Xử lý dữ liệu cờ
    action.browser_name = _browser;
    if (settings.isRunBAT) {
      action.isRunBAT = settings.isRunBAT;
    }

    let exs = ["ex"];
    if (process.env.OS == "centos") {
      exs.push("quality");
    }

    if (systemConfig.use_adblock) {
      exs.push("extensions/adblock");
    }

    if (systemConfig?.client_config_use_recaptcha_for_login) {
      exs.push("capsolver");
    }

    let level_name = "";
    if (action?.id != "reg_user" && systemConfig?.trace_names_ex?.length) {
      let traceName = "trace";

      if (
        settings.trace[action.pid] &&
        systemConfig.trace_names_ex.includes(settings.trace[action.pid])
      ) {
        traceName = "trace_ex/" + settings.trace[action.pid];
      } else {
        if (systemConfig.trace_names_ex && systemConfig.trace_names_ex.length) {
          traceName =
            systemConfig.trace_names_ex[
              Math.floor(Math.random() * systemConfig.trace_names_ex.length)
            ];

          if (traceName.includes("level_")) {
            level_name = traceName;
            traceName = "win_10_chrome";
          }

          settings.trace[action.pid] = traceName;
          traceName = "trace_ex/" + traceName;
          fs.writeFileSync("trace_config.json", JSON.stringify(settings.trace));
        }
      }

      exs.push(traceName);
      action.trace_name = level_name;
    }
    exs = exs.map((x) => path.resolve(x)).join(",");

    let param = new URLSearchParams({
      data: JSON.stringify(action),
    }).toString();
    let startPage = `http://localhost:${LOCAL_PORT}/action?` + param;

    utils.log("--BROWSER--", _browser);
    utils.log("--PID--", action.pid);

    if (WIN_ENV) {
      const proxyStr = userProxy.join(" ");
      exec(
        `${_browser} ${proxyStr} --lang=en-US,en ${windowPosition} ${windowSize} ${userDataDir} --load-extension="${exs}" "${startPage}"`
      );
    } else {
      // Đầu tiên set mặc định
      exec(
        `xdg-settings set default-web-browser ${_browser}.desktop`,
        (error) => {
          if (error) {
            console.error("Error setting default browser:", error);
            return;
          }
        }
      );
      closeChrome(action.pid);
      await utils.sleep(3000);
      utils.log("startDisplay");
      startDisplay(action.pid);
      await utils.sleep(3000);

      utils.log("start browser", action.pid);
      if (action.id == "login") {
        setDisplay(action.pid);
        try {
          // Tắt kiểm tra update trình duyệt brave
          let flagBrave = ["brave"].includes(_browser)
            ? "--no-default-browser-check"
            : "";

          const proxyStr = userProxy.join(" ");
          let cmdRun = `${params} ${_browser} ${proxyStr} ${flagBrave} --lang=en-US,en --disable-quic ${userDataDir} --load-extension="${exs}" "${startPage}" ${windowPosition} ${windowSize} --disable-security-warnings`;

          const args = [
            ...(params ? params.split(" ").filter(Boolean) : []),
            ...userProxy,
            ...(flagBrave ? [flagBrave] : []),
            "--lang=en-US,en",
            "--disable-quic",
            userDataDir,
            `--load-extension=${exs}`,
            startPage,
            windowPosition,
            windowSize,
            "--disable-security-warnings",
          ].filter(Boolean);

          if (_browser == "opera") {
            exec(`${_browser} ${userDataDir} ${windowSize}`);
            await utils.sleep(19000);
            closeChrome(action.pid);
            exec(`${_browser} ${userDataDir} ${windowSize}`);
          } else {
            spawn(_browser, args, { detached: true, stdio: "ignore" });
          }

          if (
            [
              "opera",
              "microsoft-edge",
              "microsoft-edge-stable",
              "google-chrome-stable",
              "vivaldi",
            ].includes(_browser)
          ) {
            await utils.sleep(10000);
            closeChrome(action.pid);
            await utils.sleep(2000);
            exec(cmdRun);
          } else {
            if (settings.isAfterReboot) {
              await utils.sleep(35000);
              settings.isAfterReboot = false;
            } else {
              await utils.sleep(17000);
            }
            setDisplay(action.pid);

            if (process.env.OS == "vps") {
              await utils.sleep(10000);
            }

            if (_browser != "iridium-browser") {
              sendEnter(action.pid);
            }

            await utils.sleep(8000);
          }
        } catch (error) {
          console.log("cmdRun", error);
        }
        utils.log("process login");
      } else {
        setDisplay(action.pid);

        const args = [
          params.split(" ").filter(Boolean),
          "--lang=en-US,en",
          "--disable-quic",
          ...userProxy,
          userDataDir,
          `--load-extension=${exs}`,
          startPage,
          windowPosition,
          windowSize,
        ].filter(Boolean);

        spawn(_browser, args, { detached: true, stdio: "ignore" });

        if (
          [
            "opera",
            "microsoft-edge",
            "microsoft-edge-stable",
            "google-chrome-stable",
          ].includes(_browser)
        ) {
          await utils.sleep(2000);
          closeChrome(action.pid);
          await utils.sleep(2000);
          spawn(_browser, args, {
            detached: true,
            stdio: "ignore",
          });
        }

        if (settings.IS_REG_USER) {
          await utils.sleep(10000);
          setDisplay(action.pid);
          sendEnter(action.pid);
        }

        await utils.sleep(5000);
      }
    }
  } catch (error) {
    console.log("startChromeAction lỗi", error);
  }
}
module.exports = startChromeAction;
