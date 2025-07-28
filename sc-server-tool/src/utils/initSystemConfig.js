const crypto = require("crypto");

async function initSystemConfig() {
  try {
    const ConfigModel = getModel("Config");
    const systemConfig = await ConfigModel.findOne({ key: "system" });

    if (!systemConfig) {
      youtube_config = initConfig;
      await ConfigModel.create({
        key: "system",
        data: initConfig,
      });
    } else if (!systemConfig?.data?.client_key) {
      const client_key = crypto.randomBytes(32).toString("hex");
      console.log("systemConfig.client_key", client_key);
      await ConfigModel.findOneAndUpdate(
        { key: "system" },
        { $set: { "data.client_key": client_key } },
        { new: true }
      );
      youtube_config = systemConfig.data;
    } else {
      youtube_config = systemConfig.data;
    }
  } catch (error) {
    console.log("erinitSystemConfig error", error);
  }
}
module.exports = initSystemConfig;

const initConfig = {
  client_key: crypto.randomBytes(32).toString("hex"),
  mobile_percent: 0,
  ads_percent: 100,
  max_total_profiles: 9,
  max_total_profiles_mobile: 1,
  playlists: "",
  total_times_next_video: 5,
  watching_time_non_ads: 15000,
  watching_time_start_ads: 31000,
  watching_time_end_ads: 40000,
  total_channel_created: 20,
  change_proxy_for_channel: false,
  total_loop_find_ads: 6,
  sub_percent: 0,
  brave_replay_ads_rounds: 2,
  brave_view_news_count: 1,
  total_rounds_for_change_proxy: 5,
  reset_system_time: 1,
  reset_profile_when_reset_system: false,
  percent_view_channel_youtube: [
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50,
  ],
  reboot_on_update: 0,
  is_setting_brave: true,
  max_current_profiles: 1,
  auto_renew_proxy: true,
  chrome_versions: [
    "132.0.6834.83",
  ],
  chrome_version_change_interval: 12,
};
