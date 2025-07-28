const utils = require("../../utils");
const { closeChrome } = require("../browser/closeChrome");
const getProfileIds = require("../profile/getProfileIds");
const settings = require("../settings");
const loadSystemConfig = require("./loadSystemConfig");
const execSync = require("child_process").execSync;
const fs = require("fs");

async function runUpdateVps() {
  console.log("🚀 ~ Update Vps");

  try {
    settings.isSystemChecking = true;
    await loadSystemConfig();
    // make for report upgrade

    let pids = getProfileIds();
    for (let pid of pids) {
      closeChrome(pid);
    }

    try {
      let gitKey = systemConfig.update_key;
      if (gitKey) {
        execSync(
          `git remote set-url origin https://QueesQuees:${gitKey}@github.com/QueesQuees/sc-tool.git`
        );
      }

      execSync(
        "git config pull.rebase false && git config user.name quees && git config user.email queesca@gmail.com && git stash && git pull && npm i"
      );
    } catch (error) {
      settings.isSystemChecking = false;
      return;
    }

    fs.writeFileSync("update_flag.json", JSON.stringify({ updating: true }));

    if (Number(systemConfig.reboot_on_update)) {
      execSync("git config pull.rebase false && git pull && npm i");
      await utils.sleep(40000);
      execSync("sudo systemctl reboot");
    } else {
      execSync("pm2 restart all");
    }

    await utils.sleep(15000);
    runnings = [];
  } catch (error) {
  } finally {
    settings.isSystemChecking = false;
  }
}

module.exports = runUpdateVps;
