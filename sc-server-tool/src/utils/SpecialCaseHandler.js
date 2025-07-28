const { SCRIPT_CODES } = require("./constants.js");

class SpecialCaseHandler {
  static handle(scriptCode, pid) {
    if (scriptCode === SCRIPT_CODES.GET_OTP) {
      global.ready_recovery_mail = global.ready_recovery_mail.filter((p) => p !== pid);
    } else if (scriptCode === SCRIPT_CODES.ADD_RECOVERY_MAIL) {
      delete global.wait_code[pid];
    }
  }
}

module.exports = SpecialCaseHandler;