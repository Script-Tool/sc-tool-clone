const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Browsers = require("../schemas/Browsers"); // Đảm bảo đường dẫn này chính xác
const mongoose = require("mongoose");
const getBrowserInstallCommand = require("../src/utils/getBrowserInstallCommand");
const Browser = mongoose.model("Browser", Browsers);

// Hàm để ghi file và trả về file đã được ghi
function writeFileAndSendResponse(filePath, content, res) {
  fs.writeFileSync(filePath, content);
  return res.sendFile(filePath, { root: path.join("./") });
}

// Hàm để thay thế các placeholder trong template file
function replaceTemplateVariables(templateContent, replacements) {
  let result = templateContent;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`_${key}_`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

// Route để cài đặt Docker trên Ubuntu/CentOS
router.get("/install-docker-ubuntu-centos", async function (req, res) {
  const totalVPS = req.query.total_vps || 50;
  const vmName = req.query.vm_name || "DEFAULT";
  const branch = req.query.branch || "dev";
  const CPU = req.query.cpu || "0.6";
  const keyAuth = req.query.keyAuth || "";

  const templateFileRun = fs.readFileSync(
    "./setup-files/install-docker-ubuntu-centos.sh",
    "utf8"
  );
  let fileContent = replaceTemplateVariables(templateFileRun, {
    HOST_IP: `${IP}:${PORT}`,
    TOTAL_VPS: totalVPS,
    VM_NAME: vmName,
    BRANCH: branch,
    CPU: CPU,
    KEY_AUTH: keyAuth,
  });

  fileContent = fileContent.replace(/\r\n/g, '\n');
  return writeFileAndSendResponse(
    "./file-run/install-docker-ubuntu.sh",
    fileContent,
    res
  );
});

// Route để cài đặt Docker trên Ubuntu
router.get("/install-docker-ubuntu-ubuntu", async function (req, res) {
  const totalVPS = req.query.total_vps || 50;
  const vmName = req.query.vm_name || "DEFAULT";
  const branch = req.query.branch || "reg_mail";

  const templateFileRun = fs.readFileSync(
    "./setup-files/install-docker-ubuntu-ubuntu.sh",
    "utf8"
  );
  const fileContent = replaceTemplateVariables(templateFileRun, {
    HOST_IP: `${IP}:${PORT}`,
    TOTAL_VPS: totalVPS,
    VM_NAME: vmName,
    BRANCH: branch,
  });

  return writeFileAndSendResponse(
    "./file-run/install-docker-ubuntu.sh",
    fileContent,
    res
  );
});

// Route để khởi động Docker
router.get("/start-docker", async function (req, res) {
  return res.sendFile("./setup-files/start_docker.sh", {
    root: path.join("./"),
  });
});

// Route để cài đặt và chạy YouTube trên CentOS

// Thêm biến toàn cục này ở đầu file
let lastUsedBrowserIndex = -1;

// Sửa đổi route /youtube-centos/v2
router.get("/youtube-centos/v2", async function (req, res) {
  const userName = req.query.user_name || "runuser";
  const vmName = req.query.vm_name || "PC";
  const gitKey = req.query.key || "key";
  const OS = req.query.os || "centos";

  if (gitKey) {
    const branch = req.query.branch || "reg_mail";
    const maxProfiles = req.query.maxProfiles || 1;
    const showUI = isNaN(req.query.show_ui) ? 1 : req.query.show_ui;
    const isRegUser = isNaN(req.query.reg_user) ? 0 : req.query.reg_user;

    try {
      // Lấy danh sách trình duyệt đang active
      const browsers = await Browser.find({ isDownloadable: true }).sort(
        "order"
      );

      let browserInstallCommands = "";
      let browserNames = [];

      // Lặp qua danh sách trình duyệt active
      for (const browser of browsers) {
        if (browser.versions.length > 0) {
          // Chọn phiên bản ngẫu nhiên của trình duyệt
          const randomIndex = Math.floor(
            Math.random() * browser.versions.length
          );
          const version = browser.versions[randomIndex];

          if (browser.name == "brave") {
            browserInstallCommands += `
sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/x86_64/
sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
sudo dnf install -y brave-browser
            `;
          }

          browserInstallCommands += `
# Install ${browser.name}
wget ${version.downloadLink}
sudo dnf install -y ${version.downloadLink.split("/").pop()}
          `;
          browserNames.push(browser.name);
        } else {
          browserInstallCommands += getBrowserInstallCommand(browser.name);
        }
      }

      // Nếu không tìm thấy trình duyệt nào có phiên bản, sử dụng lệnh cài đặt mặc định
      if (browsers.length === 0) {
        browserNames.push("brave");
        browserInstallCommands += `
          sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/x86_64/
          sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
          sudo dnf install -y brave-browser

        `;
      }

      if (vmName.startsWith("aws")) {
        browserInstallCommands = `
          wget --no-check-certificate -c http://103.149.28.15:9002/files/chromium-browser-stable-97.0.4673.0-1.x86_64.rpm
          sudo yum localinstall -y chromium-browser-stable-97.0.4673.0-1.x86_64.rpm
        `;
        browserNames = ["chromium-browser"];
      }

      const templateFileRun = fs.readFileSync(
        "./setup-files/youtube_centos.txt",
        "utf8"
      );
      const fileContent = replaceTemplateVariables(templateFileRun, {
        BRANCH: branch,
        HOST_IP: `${IP}:${PORT}`,
        MAX_PROFILES: maxProfiles,
        VM_NAME: vmName,
        USER: userName,
        SHOW_UI: showUI,
        IS_REG_: isRegUser,
        GIT_KEY: gitKey,
        API_KEY: process.env.API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OS: OS,
        BROWSER_INSTALL: browserInstallCommands,
        // BROWSER_NAME: browserNames.join(',')
      });

      return writeFileAndSendResponse(
        "./file-run/youtube-tool.sh",
        fileContent,
        res
      );
    } catch (error) {
      console.error("Error while getting browsers:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.send({});
  }
});


// Route để cài đặt và chạy YouTube trên CentOS với nhiều trình duyệt
router.get("/youtube-centos/browsers", async function (req, res) {
  const userName = req.query.user_name || "runuser";
  const vmName = req.query.vm_name || "PC";
  const gitKey = req.query.key || "key";
  const OS = req.query.os || "centos";

  if (gitKey) {
    const branch = req.query.branch || "reg_mail";
    const maxProfiles = req.query.maxProfiles || 1;
    const showUI = isNaN(req.query.show_ui) ? 1 : req.query.show_ui;
    const isRegUser = isNaN(req.query.reg_user) ? 0 : req.query.reg_user;

    const templateFileRun = fs.readFileSync(
      "./setup-files/youtube_centos.txt",
      "utf8"
    );
    let browser = `
      sudo yum install -y https://download3.operacdn.com/pub/opera/desktop/88.0.4412.27/linux/opera-stable_88.0.4412.27_amd64.rpm

      sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
      sudo dnf config-manager --add-repo https://packages.microsoft.com/yumrepos/edge
      sudo mv /etc/yum.repos.d/packages.microsoft.com_yumrepos_edge.repo /etc/yum.repos.d/microsoft-edge.repo
      sudo dnf install -y microsoft-edge-stable

      sudo dnf install -y dnf-plugins-core
      sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/x86_64/
      sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc
      sudo dnf install -y brave-browser

      sudo yum install -y https://downloads.vivaldi.com/stable/vivaldi-stable-5.3.2679.51-1.x86_64.rpm

      wget -nc https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
      yum --disablerepo="epel" install -y ./google-chrome-stable_current_*.rpm
    `;

    if (vmName.startsWith("aws")) {
      browser = `
        wget --no-check-certificate -c http://103.149.28.15:9002/files/chromium-browser-stable-97.0.4673.0-1.x86_64.rpm
        sudo yum localinstall -y chromium-browser-stable-97.0.4673.0-1.x86_64.rpm
      `;
    }

    const fileContent = replaceTemplateVariables(templateFileRun, {
      BRANCH: branch,
      HOST_IP: `${IP}:${PORT}`,
      MAX_PROFILES: maxProfiles,
      VM_NAME: vmName,
      USER: userName,
      SHOW_UI: showUI,
      IS_REG_: isRegUser,
      GIT_KEY: gitKey,
      API_KEY: process.env.API_KEY,
      OS: OS,
      BROWSER_INSTALL: browser,
    });

    return writeFileAndSendResponse(
      "./file-run/youtube-tool.sh",
      fileContent,
      res
    );
  }
});

// Route để cài đặt và chạy YouTube trên Ubuntu
router.get("/youtube-ubuntu/v2", async function (req, res) {
  const userName = req.query.user_name || "runuser";
  const vmName = req.query.vm_name || "PC";
  const gitKey = req.query.key || "key";

  if (gitKey) {
    const branch = req.query.branch || "reg_mail";
    const maxProfiles = req.query.maxProfiles || 1;
    const showUI = isNaN(req.query.show_ui) ? 1 : req.query.show_ui;
    const isRegUser = isNaN(req.query.reg_user) ? 0 : req.query.reg_user;
    const os = req.query.os || "ubuntu";

    const templateFileRun = fs.readFileSync(
      "./setup-files/youtube_ubuntu.txt",
      "utf8"
    );
    const browser = `
      snap install brave
      wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
      sudo dpkg -i google-chrome-stable_current_amd64.deb
    `;

    const fileContent = replaceTemplateVariables(templateFileRun, {
      BRANCH: branch,
      HOST_IP: `${IP}:${PORT}`,
      MAX_PROFILES: maxProfiles,
      VM_NAME: vmName,
      USER: userName,
      SHOW_UI: showUI,
      IS_REG_: isRegUser,
      GIT_KEY: gitKey,
      API_KEY: process.env.API_KEY,
      OS: os,
      BROWSER_INSTALL: browser,
    });

    return writeFileAndSendResponse(
      "./file-run/only-youtube-ubuntu-tool.sh",
      fileContent,
      res
    );
  } else {
    res.send({});
  }
});

router.get("/ubuntu_manage_docker", async function (req, res) {
  const userName = req.query.user_name || "runuser";
  const vmName = req.query.vm_name || "PC";
  const gitKey = req.query.key || "key";

  if (gitKey) {
    const branch = req.query.branch || "main";
    const isRegUser = isNaN(req.query.reg_user) ? 0 : req.query.reg_user;
    const os = req.query.os || "ubuntu";

    const templateFileRun = fs.readFileSync(
      "./setup-files/ubuntu_manage_docker.txt",
      "utf8"
    );

    const fileContent = replaceTemplateVariables(templateFileRun, {
      BRANCH: branch,
      HOST_IP: `${IP}:${PORT}`,
      VM_NAME: vmName,
      USER: userName,
      IS_REG_: isRegUser,
      GIT_KEY: gitKey,
      API_KEY: process.env.API_KEY,
      OS: os,
    });

    return writeFileAndSendResponse(
      "./file-run/ubuntu_manage_docker.sh",
      fileContent,
      res
    );
  } else {
    res.send({});
  }
});
// Route để cài đặt và chạy YouTube trên Ubuntu với Brave browser
router.get("/youtube-ubuntu/brave", async function (req, res) {
  const userName = req.query.user_name || "runuser";
  const vmName = req.query.vm_name || "PC";
  const apiKey = req.query.api_key;

  if (apiKey) {
    const branch = req.query.branch || "youtubeV2";
    const maxProfiles = req.query.maxProfiles || 1;
    const showUI = isNaN(req.query.show_ui) ? 1 : req.query.show_ui;
    const isRegUser = isNaN(req.query.reg_user) ? 0 : req.query.reg_user;

    const templateFileRun = fs.readFileSync(
      "./setup-files/brave-tool.txt",
      "utf8"
    );
    const browser = "snap install brave";

    const fileContent = replaceTemplateVariables(templateFileRun, {
      BRANCH: branch,
      HOST_IP: `${IP}:${PORT}`,
      MAX_PROFILES: maxProfiles,
      VM_NAME: vmName,
      USER: userName,
      SHOW_UI: showUI,
      IS_REG_: isRegUser,
      API_KEY: apiKey,
      OS: "ubuntu",
      BROWSER_INSTALL: browser,
    });

    return writeFileAndSendResponse(
      "./file-run/only-youtube-ubuntu-tool.sh",
      fileContent,
      res
    );
  } else {
    res.send({});
  }
});

// Route để cài đặt và chạy YouTube trên Ubuntu với các tùy chọn khác nhau
router.get("/youtube-ubuntu", async function (req, res) {
  const userName = req.query.user_name || "runuser";
  const vmName = req.query.vm_name || "PC";
  const gitKey = req.query.key || "key";

  if (gitKey) {
    const branch = req.query.branch || "youtube";
    const maxProfiles = req.query.maxProfiles || 1;
    const showUI = isNaN(req.query.show_ui) ? 1 : req.query.show_ui;
    const isRegUser = isNaN(req.query.reg_user) ? 0 : req.query.reg_user;

    const templateFileRun = fs.readFileSync(
      "./setup-files/youtube_ubuntu.txt",
      "utf8"
    );
    let browser = "snap install brave";
    let browserName = "brave";

    if (vmName.startsWith("vps") || vmName.startsWith("VPS")) {
      browserName = "brave-browser";
      browser = `
        sudo apt install -y apt-transport-https curl
        sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg
        echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main"|sudo tee /etc/apt/sources.list.d/brave-browser-release.list
        sudo apt update
        sudo apt install -y brave-browser
      `;
    }

    const fileContent = replaceTemplateVariables(templateFileRun, {
      BRANCH: branch,
      HOST_IP: `${IP}:${PORT}`,
      MAX_PROFILES: maxProfiles,
      VM_NAME: vmName,
      USER: userName,
      SHOW_UI: showUI,
      IS_REG_: isRegUser,
      GIT_KEY: gitKey,
      BROWSER_INSTALL: browser,
      BROWSER_NAME: browserName,
    });

    return writeFileAndSendResponse(
      "./file-run/only-youtube-ubuntu-tool.sh",
      fileContent,
      res
    );
  } else {
    res.send({});
  }
});

module.exports = router;
