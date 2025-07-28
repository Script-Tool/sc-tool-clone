const express = require("express");
var router = express.Router();
const modelName = "Service";
const fs = require("fs");
const path = require("path");
// Export API

router.get("/export-all-service", async (req, res) => {
  try {
    const Service = getModel("Service");
    const services = await Service.find({});
    const jsonContent = JSON.stringify(services, null, 2);

    // Write to a file
    fs.writeFileSync("services_export.json", jsonContent);

    res.download("services_export.json", (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
      }
      // Delete the file after download
      fs.unlinkSync("services_export.json");
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).send("Error exporting data");
  }
});

router.get("/stats", async (req, res) => {
  try {
    const YoutubeStats = await getModel("YoutubeStats");

    const now = new Date();
    const results = [];

    for (const index of Array(7)
      .fill(0)
      .map((_, idx) => idx)
      .reverse()) {
      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() - (index - 1 + 1));
      startTime.setHours(0, 0, 0, 0); // Đặt đầu ngày

      const endTime = new Date(startTime);
      endTime.setHours(23, 59, 59, 999); // Đặt cuối ngày

      // Tìm dữ liệu trong khoảng thời gian này
      const records = await YoutubeStats.find({
        timestamp: { $gte: startTime, $lt: endTime },
      })
        .populate("youtube_profile")
        .lean();

      // Tính tổng lượt xem trong khoảng thời gian này
      const viewsCount = records.reduce(
        (total, record) => total + record.viewsChange,
        0
      );
      const subsCount = records.reduce(
        (total, record) => total + record.subsChange,
        0
      );

      results.push({
        timestamp: startTime.toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "numeric",
        }),
        views: viewsCount,
        subs: subsCount,
        docs: records,
      });
    }

    res.json(results);
  } catch (error) {
    console.log("🚀 ~ app.get ~ error:", error);
    res.status(500).json({ error: "Lỗi server!" });
  }
});

module.exports = router;
