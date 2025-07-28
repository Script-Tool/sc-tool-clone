const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Lấy danh sách log với các bộ lọc
router.get("/", async (req, res) => {
  try {
    const LogModel = getModel("Log");
    const filter = {};
    const query = {};
    const queryString = [];

    // Xử lý các tham số truy vấn
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 20;

    // Lọc theo script_code
    if (req.query.script_code) {
      filter.script_code = { $regex: req.query.script_code, $options: "i" };
      query.script_code = req.query.script_code;
      queryString.push(`script_code=${req.query.script_code}`);
    }

    // Lọc theo nội dung
    if (req.query.message) {
      filter.message = { $regex: req.query.message, $options: "i" };
      query.message = req.query.message;
      queryString.push(`message=${req.query.message}`);
    }

    // Lọc theo khoảng thời gian
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);

      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$gte = startDate;

      query.startDate = req.query.startDate;
      queryString.push(`startDate=${req.query.startDate}`);
    }

    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);

      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$lte = endDate;

      query.endDate = req.query.endDate;
      queryString.push(`endDate=${req.query.endDate}`);
    }

    // Đếm tổng số lượng log phù hợp với bộ lọc
    const totalItems = await LogModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / perPage);

    // Tính toán phạm vi phân trang
    let paginationStart = Math.max(1, page - 2);
    let paginationEnd = Math.min(totalPages, page + 2);

    // Đảm bảo luôn hiển thị 5 trang nếu có thể
    if (paginationEnd - paginationStart + 1 < 5 && totalPages > 5) {
      if (paginationStart === 1) {
        paginationEnd = Math.min(5, totalPages);
      } else if (paginationEnd === totalPages) {
        paginationStart = Math.max(1, totalPages - 4);
      }
    }

    // Lấy danh sách log với phân trang
    const logs = await LogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const queryStringText =
      queryString.length > 0 ? "&" + queryString.join("&") : "";

    // Render trang logs
    res.render("oam/logs", {
      title: "Quản lý Log",
      logs,
      current_page: page,
      per_page: perPage,
      total_items: totalItems,
      total_pages: totalPages,
      pagination_start: paginationStart,
      pagination_end: paginationEnd,
      query,
      query_string: queryStringText,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách log:", error);
    res.status(500).send("Lỗi máy chủ nội bộ");
  }
});

// Lấy chi tiết log
router.get("/:id", async (req, res) => {
  try {
    const LogModel = getModel("Log");
    const log = await LogModel.findById(req.params.id);

    if (!log) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy log" });
    }

    res.json({ success: true, log });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết log:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
});

// Xóa tất cả log
router.delete("/clear", async (req, res) => {
  try {
    const LogModel = getModel("Log");
    await LogModel.deleteMany({});
    res.json({ success: true, message: "Đã xóa tất cả log thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa tất cả log:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
});

// Xóa một log
router.delete("/:id", async (req, res) => {
  try {
    const LogModel = getModel("Log");
    const result = await LogModel.findByIdAndDelete(req.params.id);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy log" });
    }

    res.json({ success: true, message: "Đã xóa log thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa log:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
});


module.exports = router;
