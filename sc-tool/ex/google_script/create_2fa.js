async function create2fa(action) {
  const url = window.location.toString();

  try {
    if (url.includes(action.directLink)) {
      await goToLocation(
        action.pid,
        "myaccount.google.com/two-step-verification/authenticator"
      );
    } else if (
      url.includes(
        "myaccount.google.com/two-step-verification/authenticator"
      ) ||
      url.includes("myaccount.google.com/signinoptions/twosv")
    ) {
      await handleCreate2FA(action);
      return;
    } else if (
      url.indexOf("accounts.google.com/v3/signin/challenge/pwd") > -1
    ) {
      action.relogin = true;
      await setActionData(action);
      await waitForSelector("input[name='Passwd']");
      await userTypeEnter(action.pid, "input[name='Passwd']", action.password);
      await sleep(190000);
    } else if (url.indexOf("accounts.google.com/v3/signin/identifier") > -1) {
      await updateActionStatus(
        action.pid,
        "login",
        0,
        "accounts.google.com/v3/signin/identifier"
      );
      return;
    } else if (url.indexOf("myaccount.google.com") > -1) {
      await reportScript(action);
    } else {
      action.data_reported = "Lỗi: " + url;
      await reportScript(action, false);
    }
  } catch (error) {
    action.data_reported = "Lỗi: " + url;
    await reportScript(action, false);
  }
}
