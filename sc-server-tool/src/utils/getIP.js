const publicIp = require('public-ip');
const os = require('os');

async function getIP() {
  try {
    // Thử lấy IP công cộng
    return await publicIp.v4();
  } catch (error) {
    console.warn("Không thể lấy IP công cộng, sử dụng IP cục bộ thay thế");
    // Lấy IP cục bộ nếu không lấy được IP công cộng
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const interface of interfaces[name]) {
        const { address, family, internal } = interface;
        if (family === 'IPv4' && !internal) {
          return address;
        }
      }
    }
    // Nếu không tìm thấy IP nào, trả về một giá trị mặc định
    return '127.0.0.1';
  }
}

module.exports = getIP
// Sử dụng
