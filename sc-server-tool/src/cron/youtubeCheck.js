const CronJob = require("cron").CronJob;
const youtubeService = require("../services/youtubeService");

function startCronJob() {
  new CronJob(
    "0 0 * * *", // Chạy vào 00:00 mỗi ngày
    async function () {
      console.log("Running daily check for new videos");
      try {
        await youtubeService.checkAllChannelsAndCreatePlaylists();
        console.log("Daily check completed");
      } catch (error) {
        console.error("Error in daily check:", error);
      }
    },
    null,
    true,
    "Asia/Ho_Chi_Minh" // Điều chỉnh múi giờ nếu cần
  );
}

function youtubeStatsJob() {
  new CronJob(
    "0 0 * * *", // Chạy vào 00:00 mỗi ngày
    async function () {
      try {
        await youtubeService.statisticYoutube();

        console.log("Daily check completed");
      } catch (error) {
        console.error("Error in daily check:", error);
      }
    },
    null,
    true,
    "Asia/Ho_Chi_Minh" // Điều chỉnh múi giờ nếu cần
  );
}

module.exports = { startCronJob, youtubeStatsJob };
