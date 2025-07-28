const execSync = require("child_process").execSync;
const { getBrowserOfProfile } = require("./getBrowserOfProfile");

/**
 * Đóng trình duyệt Chrome cho một profile cụ thể
 * @param {string|number} pid - ID của profile
 */
function closeChrome(pid) {
  let browserName = getBrowserOfProfile();
  if (browserName.includes("chrome")) {
    browserName = "chrome";
  } else if (browserName.includes("brave")) {
    browserName = "brave";
  }
  try {
    if (WIN_ENV) {
      // Nếu là môi trường Windows, sử dụng lệnh 'input CLOSE_CHROME' để đóng Chrome
      execSync("input CLOSE_CHROME");
    } else {
      // Nếu không có pid, đóng Chrome dựa trên tên trình duyệt mặc định của profile
     
      if (pid) {
        execSync(`pkill -f "profiles/${pid}"`);
      } else {
        execSync(`pkill ${browserName}`);
      }
    }
  } catch (e) {
    // Xử lý hoặc ghi log ngoại lệ ở đây
    try {
      // Thử đóng trình duyệt bằng lệnh pkill -9
      execSync(`pkill ${browserName}`);
    } catch (e) {}
  }
}

module.exports = { closeChrome };
