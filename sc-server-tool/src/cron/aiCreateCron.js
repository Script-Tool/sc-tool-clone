const { CronJob } = require("cron");
const {
  updateAiCreateServiceStatus,
  updateCreateVideoService,
} = require("../services/serviceService");

function aiCreateCron() {
  new CronJob(
    "0 * * * *", // Chạy vào 00:00 mỗi ngày
    async function () {
      try {
        await updateAiCreateServiceStatus();
        console.log("update completed");
      } catch (error) {
        console.error("Error in daily check:", error);
      }
    },
    null,
    true,
    "Asia/Ho_Chi_Minh" // Điều chỉnh múi giờ nếu cần
  );
}

function createVideoCronJob() {
  new CronJob(
    "*/30 * * * *",
    async function () {
      try {
        await updateCreateVideoService();
      } catch (error) {
        console.error("Error in daily check:", error);
      }
    },
    null,
    true,
    "Asia/Ho_Chi_Minh" // Điều chỉnh múi giờ nếu cần
  );
}

module.exports = { aiCreateCron, createVideoCronJob };
