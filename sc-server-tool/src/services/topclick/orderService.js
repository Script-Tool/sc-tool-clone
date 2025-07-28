const axios = require("axios");

async function updateOrderStatus(code, status, quantity) {
  if (code) {
    const data = {
      code: code,
      status: status,
    };

    // Chỉ thêm quantity nếu nó được cung cấp
    if (quantity) {
      data.quantity = quantity;
    }

    const config = {
      method: "put",
      maxBodyLength: Infinity,
      url: `${process.env.WEB_URL}/tool/orders/status`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WEB_API_KEY}`,
      },
      data: JSON.stringify(data),
    };

    try {
      let response = await axios.request(config); // Gọi API mà không cần xử lý kết quả
      return response.data;
    } catch (error) {
      return {
        success: false,
      };
    }
  }
}

module.exports = { updateOrderStatus };
