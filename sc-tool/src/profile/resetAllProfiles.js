const request_api = require("../../request_api");
const settings = require("../settings");
const fs = require("fs");
const getProfileIds = require("./getProfileIds");
const { closeChrome } = require("../browser/closeChrome");
const utils = require("../../utils");
const execSync = require("child_process").execSync;

async function resetAllProfiles() {
  console.log("🚀 ~ Reset Profiles ");

  settings.isSystemChecking = true;
  try {
    let pids = getProfileIds();
    for (let pid of pids) {
      closeChrome(pid);
    }

    for await (let pid of pids) {
      await request_api.updateProfileData({
        pid: Number(pid),
        status: "RESET",
      });
    }
    await utils.sleep(4000);
    if (fs.existsSync("profiles")) {
      try {
        execSync("rm -rf profiles");
        execSync("mkdir profiles");
        settings.trace = {};
        execSync("rm -rf trace_config.json");
        config.browser_map = {};
        fs.writeFileSync("vm_log.json", JSON.stringify(config));
      } catch (error) {}
    }

    runnings = [];
    settings.ids = [];
  } catch (error) {
  } finally {
    settings.isSystemChecking = false;
  }
}

module.exports = resetAllProfiles;
