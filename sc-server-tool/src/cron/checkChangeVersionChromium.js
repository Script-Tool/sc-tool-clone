// Lưu thời gian thay đổi version cuối cùng
let lastChangeTime = new Date();

// Hàm rotate array - đưa phần tử thứ 2 lên đầu, phần tử đầu xuống cuối
const rotateVersions = (versions) => {
  if (versions.length <= 1) return versions;
  return [...versions.slice(1), versions[0]];
};

// Hàm kiểm tra xem đã đủ thời gian để thay đổi chưa
const shouldChangeVersions = (intervalHours) => {
  const now = new Date();
  const hoursSinceLastChange = (now - lastChangeTime) / (1000 * 60 * 60);
  return hoursSinceLastChange >= intervalHours;
};

// Khởi tạo CronJob

async function checkChangeVersionChromium() {
  try {
    // Lấy config từ file cấu hình
    const config = youtube_config;

    // Kiểm tra xem đã đủ thời gian chưa
    if (shouldChangeVersions(config.chrome_version_change_interval)) {
      // Rotate mảng versions
      config.chrome_versions = rotateVersions(config.chrome_versions);

      // Cập nhật thời gian thay đổi
      lastChangeTime = new Date();

      console.log("Chrome versions rotated:", config.chrome_versions);
    }
  } catch (error) {
    console.error("Error in checkChangeVersionChromium:", error);
  }
}

module.exports = {
  checkChangeVersionChromium,
  // Export thêm các hàm để có thể test
  _rotateVersions: rotateVersions,
  _shouldChangeVersions: shouldChangeVersions,
};
