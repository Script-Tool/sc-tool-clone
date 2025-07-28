const execSync = require('child_process').execSync;

function sendEnter(pid) {
    try {
        if (!WIN_ENV) {
            if (!IS_SHOW_UI) {
                process.env.DISPLAY = ':' + pid
            }

            execSync(`xdotool key KP_Enter && sleep 3`)// && xdotool windowsize $(xdotool search --onlyvisible --pid $(pgrep -f "profiles/${pid}" | head -n 1) --class surf) 1920 1040 && sleep 1`)
        }
    }
    catch (e) {
    }
}

module.exports = sendEnter