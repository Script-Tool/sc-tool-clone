// const Browser = require("../../schemas/BrowserSchema");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Browsers = require("../../schemas/Browsers");

const Browser = mongoose.model("Browser", Browsers);

// Lấy danh sách trình duyệt
router.get("/", async (req, res) => {
  const browsers = await Browser.find().sort("order");
  res.json(browsers);
});

// Thêm trình duyệt mới
router.post("/", async (req, res) => {
  console.log("add browsers");
  const { name, order } = req.body;
  const browser = new Browser({ name, order, versions: [] });
  await browser.save();
  res.json(browser);
});

// Cập nhật trình duyệt
// router.put("/:id", async (req, res) => {
//   const { name, order } = req.body;
//   const browser = await Browser.findByIdAndUpdate(
//     req.params.id,
//     { name, order },
//     { new: true }
//   );
//   res.json(browser);
// });

// Xóa trình duyệt
router.delete("/:id", async (req, res) => {
  await Browser.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Thêm phiên bản mới cho trình duyệt
router.post("/:id/versions", async (req, res) => {
  const { version, downloadLink } = req.body;
  const browser = await Browser.findById(req.params.id);
  browser.versions.push({ version, downloadLink });
  await browser.save();
  res.json(browser);
});

// Xóa phiên bản của trình duyệt
router.delete("/:browserId/versions/:versionId", async (req, res) => {
  const browser = await Browser.findById(req.params.browserId);
  browser.versions.id(req.params.versionId).remove();
  await browser.save();
  res.json(browser);
});
// Cập nhật trạng thái active của trình duyệt
router.patch("/:id/toggle-active", async (req, res) => {
  const browser = await Browser.findById(req.params.id);
  browser.isActive = !browser.isActive;
  await browser.save();
  res.json(browser);
});

// Cập nhật tên trình duyệt
router.patch("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const browser = await Browser.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!browser) {
      return res.status(404).json({ message: "Không tìm thấy trình duyệt" });
    }
    res.json(browser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update browser
router.put("/:id", async (req, res) => {
  const { name, order, isActive, isDownloadable } = req.body;
  const browser = await Browser.findByIdAndUpdate(
    req.params.id,
    { name, order, isActive, isDownloadable },
    { new: true }
  );
  res.json(browser);
});

// Toggle downloadable status of a browser
router.patch("/:id/toggle-downloadable", async (req, res) => {
  const browser = await Browser.findById(req.params.id);
  browser.isDownloadable = !browser.isDownloadable;
  await browser.save();
  res.json(browser);
});

// Export tất cả trình duyệt
router.get("/export", async (req, res) => {
  try {
    const browsers = await Browser.find().sort("order");
    res.json(browsers);
  } catch (error) {
    res.status(500).json({ error: "Error exporting browsers" });
  }
});

// Import trình duyệt
router.post("/import", async (req, res) => {
  try {
    const browsers = req.body;
    await Browser.insertMany(browsers, { ordered: false }).catch((error) => {
      if (error.code === 11000) {
        console.log("Duplicate keys found, skipping duplicates");
      } else {
        throw error;
      }
    }); // Thêm các trình duyệt mới
    res.json({ success: true, message: "Browsers imported successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error importing browsers" });
  }
});

module.exports = router;
