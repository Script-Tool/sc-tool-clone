const apiRequest = require("../api/apiRequest");
const { closeChrome } = require("../browser/closeChrome");
const installBrave = require("../execSync/installBrave");
const getOrCreateUniqueId = require("./getOrCreateUniqueId");
const SUB_URL = `http://${devJson.hostIp}`;

// ... các import và code khác ...

async function checkAndInstallBrave(link_brave) {
  try {
    const vmId = getOrCreateUniqueId();

    const checkResponse = await apiRequest({
      method: "post",
      url: `${SUB_URL}/api-alex/config/check-brave-installation`,
      data: { vmId },
    });

    if (checkResponse.data.success) {
      if (!checkResponse.data.isInstalled) {
        closeChrome();
        await installBrave(link_brave || "");

       
      } else {
      }
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra hoặc cài đặt Brave Browser:", error);
  }
}

module.exports = checkAndInstallBrave;
