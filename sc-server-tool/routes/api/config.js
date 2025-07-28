const express = require("express");
var router = express.Router();
const Browsers = require("../../schemas/Browsers"); // Đảm bảo đường dẫn này chính xác
const mongoose = require("mongoose");
const Browser = mongoose.model("Browser", Browsers);

router.get("/system", async function (req, res) {
  const ignoreKeys = [
    "suggest_percent",
    "page_watch",
    "direct_percent",
    "search_percent",
    "percent_view_channel_youtube",
    "update_key",
    "codesim_api_key",
    "ndline_api_key",
    "viotp_api_key",
    "gogetsms_api_key",
    "five_sim_api_key",
    "watching_time_non_ads",
    "watching_time_start_ads",
    "watching_time_end_ads",
    "total_times_next_video",
    "chothuesimcode_api_key",
    "gpt_script_template_suffix",
    "gpt_script_template",
    "gpt_template",
    "chat_gpt_api_key",
    "client_config_run_facebook",
    "client_config_run_youtube",
    "client_config_run_x",
    "client_config_run_tiktok",
    "client_config_run_google_map",
    "client_key",
    "chrome_versions",
    "chrome_version_change_interval"
  ];

  try {
    // Lấy danh sách các browsers đang active và có version từ database
    const activeBrowsers = await Browser.find({
      isActive: true,
    }).select("name");

    // Chuyển đổi kết quả thành mảng tên browsers
    const browserNames = activeBrowsers.map((browser) => browser.name);

    let data = {
      ...youtube_config,
      chrome_version: youtube_config?.chrome_versions?.[0] || "131.0.6834.83",
      browser_mobile_percent: youtube_config.mobile_percent,
      ads_percent: youtube_config.ads_percent,
      browsers: browserNames, // Thay thế browsers bằng danh sách mới
    };

    let dataMaped = {};
    Object.keys(data).forEach((key) => {
      if (!ignoreKeys.includes(key) && data[key] !== "") {
        dataMaped[key] = data[key];
      }
    });

    if (!dataMaped.trace_names_ex) {
      dataMaped.trace_names_ex = [];
    }
    if (req.query.isGetMobile) {
      dataMaped["active_devices"] = active_devices;
    }
  
    return res.send(dataMaped);
  } catch (error) {
    console.error("Error fetching browser data:", error);
    return res.send({ error: "error while get config" });
  }
});

router.get("/system-mobile", async function (req, res) {
  let ignoreKeys = [
    "suggest_percent",
    "page_watch",
    "direct_percent",
    "search_percent",
    "percent_view_channel_youtube",
    "update_key",
    "codesim_api_key",
    "ndline_api_key",
    "viotp_api_key",
    "watching_time_non_ads",
    "watching_time_start_ads",
    "watching_time_end_ads",
    "total_times_next_video",
    "chothuesimcode_api_key",
    "gpt_script_template_suffix",
    "gpt_script_template",
    "gpt_template",
    "chat_gpt_api_key",
    "browser",
    "max_total_profiles",
    "brave_replay_ads_rounds",
    "brave_view_news_count",
    "playlists",
    "trace_names_ex",
  ];

  try {
    let data = {
      ...youtube_config,
      browser_mobile_percent: youtube_config.mobile_percent,
      ads_percent: youtube_config.ads_percent,
    };

    let dataMaped = {};
    Object.keys(data).forEach((key) => {
      if (!ignoreKeys.includes(key) && data[key] != "") {
        dataMaped[key] = data[key];
      }
    });

    if (!dataMaped.trace_names_ex) {
      dataMaped.trace_names_ex = [];
    }
    if (req.query.isGetMobile) {
      dataMaped["active_devices"] = active_devices;
    }

    return res.send(dataMaped);
  } catch (error) {
    return res.send({ error: "error while get config" });
  }
});

let globalTimer = {
  startTime: Date.now(),
  isReady: false,
};
function getRandomWaitTime() {
  // Random từ 10000 đến 15000 milliseconds (10 đến 15 giây)
  return Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
}
function resetTimer() {
  globalTimer.startTime = Date.now();
  globalTimer.isReady = false;
  const waitTime = getRandomWaitTime();
  setTimeout(() => {
    globalTimer.isReady = true;
  }, waitTime); //  seconds
}
resetTimer();
// Kiểm tra và cài đặt brave
router.post("/check-brave-installation", async function (req, res) {
  try {
    if (!globalTimer.isReady) {
      // Nếu chưa đủ 15 -20 giây, trả về ngay lập tức
      return res.json({
        success: true,
        isInstalled: true,
      });
    }

    resetTimer();
    const { vmId } = req.body;
    const BraveInstallation = getModel("BraveInstallation");

    let installation = await BraveInstallation.findOne({ vmId });

    res.json({
      success: true,
      isInstalled: installation ? installation.isInstalled : false,
    });
  } catch (error) {
    console.error("Error checking Brave installation status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/update-brave-installation", async function (req, res) {
  try {
    const { vmId, isInstalled } = req.body;
    const BraveInstallation = getModel("BraveInstallation");

    await BraveInstallation.findOneAndUpdate(
      { vmId },
      { isInstalled, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Brave installation status updated" });
  } catch (error) {
    console.error("Error updating Brave installation status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/update-brave-installation-done", async function (req, res) {
  try {
    globalTimer.isReady = true;
    res.json({ success: true, message: "Reset Time ok" });
  } catch (error) {
    console.error("Error updating Brave installation status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
