const { updateOrderStatus } = require("./topclick/orderService");

// Tiện ích để xử lý cập nhật dịch vụ
const handleServiceUpdate = async (serviceId, remaining, orderId = null) => {
  await getModel("Service").updateOne(
    { _id: serviceId },
    { $set: { remaining } }
  );

  if (orderId) {
    try {
      const result = await updateOrderStatus(orderId, "completed");
      console.log("Kết quả cập nhật đơn hàng:", orderId, result);
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    }
  }
};

// Cải tiến bộ kiểm tra số liệu YouTube
async function checkAndUpdateYoutubeService(currentValue, service) {
  const today = new Date().getDate();
  console.log(logBh[today]);
  try {
    if (!service || service.status === "hoantat") {
      // Xử lý dịch vụ đã hoàn thành
      await handleServiceUpdate(service._id, 0, service.order_id);
      return;
    }

    const targetValue =
      service.fisrt_remaining + parseInt(service.fisrt_value_log);

    // Kiểm tra giá trị số
    if (isNaN(currentValue) || isNaN(targetValue)) {
      console.warn("Phát hiện giá trị không hợp lệ:", {
        currentValue,
        targetValue,
      });
      return;
    }

    if (currentValue >= targetValue) {
      // Đã đạt mục tiêu - đánh dấu hoàn thành
      await handleServiceUpdate(service._id, 0, service.order_id);
    } else {
      // Tính toán số còn lại với đệm 10%
      const remaining = targetValue - currentValue;
      const totalWithBuffer = remaining + Math.ceil(remaining * 0.1);

      // Cập nhật log hàng ngày
      const today = new Date().getDate();
      logBh[today] = (logBh[today] || 0) + totalWithBuffer;

      console.log(logBh[today]);

      await handleServiceUpdate(service._id, totalWithBuffer);
    }
  } catch (error) {
    console.error("Lỗi trong checkAndUpdateYoutubeService:", error.message);
    throw error; // Ném lỗi để xử lý phù hợp
  }
}

// Cải tiến bộ kiểm tra trạng thái

// Cải tiến bộ chuyển đổi số người đăng ký
function convertSubscriberCount(subscriberString = "") {
  try {
    if (!subscriberString) return 0;

    const MULTIPLIERS = {
      K: 1000,
      N: 1000,
      "พัน": 1000, // Nghìn trong tiếng Thái
      M: 1000000,
      Tr: 1000000,
    };

    subscriberString = subscriberString.trim();

    // Tìm hệ số nhân phù hợp
    const multiplier = Object.entries(MULTIPLIERS).reduce(
      (acc, [key, value]) => {
        return subscriberString.includes(key) ? value : acc;
      },
      1
    );

    // Trích xuất giá trị số
    const numericValue = parseFloat(subscriberString.replace(/[^0-9.]/g, ""));
    return Math.round(numericValue * multiplier);
  } catch (error) {
    console.error("Lỗi chuyển đổi số người đăng ký:", error);
    return 0;
  }
}

module.exports = {
  checkAndUpdateYoutubeService,
  convertSubscriberCount,
};
