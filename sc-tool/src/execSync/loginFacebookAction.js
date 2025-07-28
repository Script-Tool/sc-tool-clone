const execSync = require("child_process").execSync;
async function loginFacebookAction(action) {
  switch (action) {
    case "NeverBtn":
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Return`);
      break;
    case "AuthenticationApp":
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Down`);
      break;
    case "AlwaysConfirmItMe":
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Return`);
      execSync(`xdotool key Return`);

      execSync(`xdotool sleep 2`);
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Tab`);
      execSync(`xdotool key Return`);
      break;

    default:
      break;
  }
}

module.exports = loginFacebookAction;
