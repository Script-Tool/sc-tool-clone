async function change2fa(action) {
  const url = window.location.href;

  try {
    if (url.includes(action.directLink)) {
      await goToLocation(
        action.pid,
        "myaccount.google.com/two-step-verification/authenticator"
      );
      return;
    }

    if (
      url.includes(
        "myaccount.google.com/two-step-verification/authenticator"
      ) ||
      url.includes("myaccount.google.com/signinoptions/twosv")
    ) {
      await handleChange2fa(action);
      return;
    }

    if (url.includes("accounts.google.com/v3/signin/challenge/pwd")) {
      action.relogin = true;
      await setActionData(action);
      await waitForSelector("input[name='Passwd']");
      await userTypeEnter(action.pid, "input[name='Passwd']", action.password);
      await sleep(19000);
      return;
    }

    if (url.includes("accounts.google.com/v3/signin/challenge/totp")) {
      if (!action?.twoFA && action?.backupCode) {
        const tryAnotherWay = getElementContainsInnerText(
          "span",
          ["Try another way"],
          "",
          "equal"
        );

        await userClick(action.pid, 'button[jsname="Pr7Yme"]', tryAnotherWay);

        return;
      }

      await waitForSelector("input[name='totpPin']");

      const response2fa = await getCode2FAFacebook(action?.twoFA);
      const totpPin2FA = response2fa.token || "";

      await userTypeEnter(action.pid, "input[name='totpPin']", totpPin2FA);
      await sleep(19000);
    }

    if (url.includes("accounts.google.com/v3/signin/identifier")) {
      await updateActionStatus(
        action.pid,
        "login",
        0,
        "accounts.google.com/v3/signin/identifier"
      );
      return;
    }

    if (url.includes("myaccount.google.com")) {
      await reportScript(action);
      return;
    }

    // Trường hợp khác
    throw new Error(`Unexpected URL: ${url}`);
  } catch (error) {
    console.error("Change2FA Error:", error);
    action.data_reported = "Lỗi: " + url;
    await reportScript(action, false);
  }
}

async function handleChange2fa(action) {
  try {
    const setUpAuthenticator = getElementContainsInnerText(
      "span",
      ["Set up authenticator"],
      "",
      "equal"
    );

    if (setUpAuthenticator) {
      await handleCreate2FA(action);
      return;
    }

    const changeAuthenticatorApp = getElementContainsInnerText(
      "span",
      ["Change authenticator app"],
      "",
      "equal"
    );
    if (changeAuthenticatorApp) {
      await userClick(
        action.pid,
        "ChangeAuthenticatorApp",
        changeAuthenticatorApp
      );
      await sleep(2000);
    }

    const cantScanItBtn = document.querySelector("center div");
    if (cantScanItBtn) {
      await userClick(action.pid, "cantScanItBtn", cantScanItBtn);
      await sleep(1000);
    }

    const strongElements = document.querySelectorAll(".mzEcT strong");
    if (strongElements.length < 3) {
      throw new Error("Không tìm thấy mã 2FA");
    }

    const twoFA = strongElements[2].textContent.replace(/\s/g, "");

    const nextBtn = getElementContainsInnerText("span", ["Next"], "", "equal");
    if (nextBtn) {
      await userClick(action.pid, "nextBtn", nextBtn);
      await sleep(1000);
    }

    const response2fa = await getCode2FAFacebook(twoFA);
    console.log("2FA Info:", twoFA, response2fa);

    const totpPin2FA = response2fa?.token || "";
    if (!totpPin2FA) {
      throw new Error("Không lấy được mã 2FA từ server");
    }

    await userTypeEnter(
      action.pid,
      "input[placeholder='Enter Code']",
      totpPin2FA
    );
    await sleep(3000);

    await updateProfileData({
      pid: action.pid,
      twoFA: twoFA,
      is_change_2fa: false,
    });
    await sleep(3000);

    await reportScript(action);
  } catch (error) {
    console.error("HandleChange2FA Error:", error);
    action.data_reported = "Lỗi khi xử lý 2FA: " + error.message;
    await reportScript(action, false);
  }
}
