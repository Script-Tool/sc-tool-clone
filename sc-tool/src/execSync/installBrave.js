const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require('util');
const execPromise = util.promisify(exec);
const apiRequest = require("../api/apiRequest");
const getOrCreateUniqueId = require("../utils/getOrCreateUniqueId");
const SUB_URL = `http://${process.env.HOST_IP}`;

const REBOOT_FLAG_FILE = path.join(__dirname, "reboot_flag.txt");

function deleteRPMFiles(directory) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    if (path.extname(file).toLowerCase() === ".rpm") {
      const filePath = path.join(directory, file);
      fs.unlinkSync(filePath);
    }
  });
}

async function installBrave(link_brave) {
  const vmId = getOrCreateUniqueId();

  try {
    // Kiểm tra xem đã reboot lần đầu chưa
    if (!fs.existsSync(REBOOT_FLAG_FILE)) {
      // Chưa reboot lần đầu, tạo flag file và reboot
      fs.writeFileSync(REBOOT_FLAG_FILE, "first_reboot");
      await execPromise("pm2 restart all");
      return;
    }

    // Đã reboot lần đầu, tiến hành cài đặt Brave

    let filename = link_brave.split("/").pop();
    let filePath = path.join(__dirname, filename);

    // Xóa tất cả các file .rpm trong thư mục hiện tại
    deleteRPMFiles(__dirname);

    await execPromise(`wget -O "${filePath}" "${link_brave}"`);
    await execPromise(`sudo dnf install -y "${filePath}"`);


    await apiRequest({
      method: "post",
      url: `${SUB_URL}/api-alex/config/update-brave-installation`,
      data: { vmId, isInstalled: true },
    });

    const checkResponse = await apiRequest({
      method: "post",
      url: `${SUB_URL}/api-alex/config/update-brave-installation-done`,
    });


    await execPromise("git config pull.rebase false && git pull && npm i && sleep 40");

    // Xóa tất cả các file .rpm sau khi cài đặt
    deleteRPMFiles(__dirname);

    // Xóa file flag reboot
    fs.unlinkSync(REBOOT_FLAG_FILE);

    // Thêm lại lệnh pm2 restart all ở cuối quá trình cài đặt
    await execPromise("pm2 restart all");

    return checkResponse.data;
  } catch (error) {
    console.error("Lỗi trong quá trình cài đặt Brave:", error);
    throw error;
  }
}

module.exports = installBrave;