const express = require('express');
const router = express.Router();

// Route để lấy danh sách người dùng
router.get('/', (req, res) => {
  // Gửi phản hồi với nội dung "respond with a resource"
  res.send('respond with a resource');
});

module.exports = router;