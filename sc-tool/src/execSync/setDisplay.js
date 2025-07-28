const execSync = require('child_process').execSync;
const settings = require('../settings');
const { getBrowserOfProfile } = require('../browser/getBrowserOfProfile');


function setDisplay(pid) {
    try {
        if (IS_SHOW_UI) {
            if (settings.MAX_CURRENT_ACC > 1) {
                let browser = getBrowserOfProfile(pid)
                execSync(`wmctrl -x -a ${browser}`)
            }
        } else {
            if (!WIN_ENV) {
                process.env.DISPLAY = ':' + pid
            }
        }
    }
    catch (e) {
        consoel.log("setDisplay", e)
    }
}

module.exports = setDisplay