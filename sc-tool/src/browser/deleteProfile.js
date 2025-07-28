const del = require("del");
const utils = require("../../utils");
const settings = require("../settings");
const { closeChrome } = require("./closeChrome");
const path = require("path");
const execSync = require("child_process").execSync;

/* 
* Xoá profile
*/
async function deleteProfile(pid, retry = 0) {
  settings.ids = settings.ids.filter(x => x != pid);
  runnings = runnings.filter(r => r.pid != pid);
  try {
    try {
      if (!WIN_ENV) {
        execSync(`pkill -f "Xvfb :${pid}"`);
      }
    } catch (e) {}
    closeChrome(pid);
    del.sync([path.resolve("profiles", pid + "", "**")], { force: true });
  } catch (e) {
    if (retry < 3) {
      await utils.sleep(3000);
      await deleteProfile(pid, retry + 1);
    }
  }
}

function stopDisplay(pid) {
  try {
    if (!WIN_ENV) {
      execSync(`pkill -f "Xvfb :${pid}"`);
    }
  } catch (e) {}
}

module.exports = deleteProfile;
