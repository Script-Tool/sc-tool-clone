async function threeStepVerification(action) {
  try {
    let url = window.location.toString();

    // Bật xác thực 2fa
    if (
      url.indexOf(
        "https://myaccount.google.com/two-step-verification/authenticator"
      ) > -1 ||
      url.indexOf("https://myaccount.google.com/signinoptions/twosv") > -1
    ) {
      await handleCreate2FA(action);
    }
    await handleLoginGoogle(action);

    if (url.indexOf("youtube.com/verify_phone_number") > -1) {
      closeUnactiveTabs();
      await verify_phone_number(action);
    } else if (url.indexOf("https://studio.youtube.com/channel") > -1) {
      const btnTiepTuc = document.querySelector(
        "#dismiss-button > ytcp-button-shape"
      );
      if (btnTiepTuc) await userClick(action.pid, "btnTiepTuc", btnTiepTuc);
      await sleep(2000);

      const confirmBtn = document.querySelector("#confirm-button");
      if (confirmBtn) {
        await sleep(2000);
        await userClick(action.pid, "next", confirmBtn);

        await sleep(10000);

        const response2fa = await getCode2FAFacebook(
          action?.twoFA?.replace(/\s+/g, "")
        );
        const totpPin2FA = response2fa.token || "";

        await updateUserInput(
          action.pid,
          "ONLY_TYPE_CHAR",
          0,
          0,
          0,
          0,
          totpPin2FA
        );
        await sleep(3000);
        await updateUserInput(action.pid, "KEY_ENTER");
        await sleep(3000);

        await updateProfileData({
          pid: action.pid,
          verified_studio: 1,
        });
      } else {
        await updateProfileData({
          pid: action.pid,
          verified_studio: -1,
        });
      }
      await sleep(5000);

      await advancedFeatures(action);
    }
  } catch (error) {
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      error?.message || error
    );
  }
}

async function handleLoginGoogle(action) {
  try {
    await sleep(5000);
    let url = window.location.toString();
    let emailRecovery = action.recover_mail;
    if (
      url.indexOf("https://accounts.google.com/signin/v2/identifier") > -1 ||
      url.indexOf("https://accounts.google.com/v3/signin/identifier") > -1
    ) {
      await waitForSelector("#identifierId");
      await userTypeEnter(action.pid, "#identifierId", action.email);
      await sleep(180000);
    } else if (
      url.indexOf("accounts.google.com/v3/signin/challenge/pwd") > -1
    ) {
      action.relogin = true;
      await setActionData(action);
      await waitForSelector("input[name='Passwd']");
      await userTypeEnter(action.pid, "input[name='Passwd']", action.password);
      await sleep(190000);
    } else if (url.indexOf("v3/signin/challenge/selection") > -1) {
      console.log("v3/signin/challenge/selection", emailRecovery);

      if (
        document.querySelector("[data-challengetype='12']") &&
        emailRecovery &&
        emailRecovery.length > 0
      ) {
        await userClick(action.pid, "[data-challengetype='12']");
      } else if (
        (await document.querySelector("[data-challengetype='13']")) &&
        recoverPhone &&
        recoverPhone.length > 0
      ) {
        await userClick(action.pid, "[data-challengetype='13']");
      } else {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "unknown challengetype"
        );
        return;
      }

      await sleep(36000);
    } else if (
      url.indexOf("accounts.google.com/signin/selectchallenge") > -1 ||
      url.indexOf("https://accounts.google.com/signin/v2/challenge/selection") >
        -1 ||
      url.indexOf("https://accounts.google.com/v3/signin/challenge/selection") >
        -1
    ) {
      if (!action?.twoFA && action?.backupCode) {
        if (document.querySelectorAll('[data-action="selectchallenge"]')[1]) {
          await userClick(
            action.pid,
            '[data-action="selectchallenge"]',
            document.querySelectorAll('[data-action="selectchallenge"]')[1]
          );
          return;
        }
      }
    } else if (
      url.indexOf("https://accounts.google.com/v3/signin/challenge/bc") > -1
    ) {
      await waitForSelector('input[type="tel"]');
      await userTypeEnter(action.pid, 'input[type="tel"]', action?.backupCode);
    }
    // xác thực 2fa
    else if (url.indexOf("signin/challenge/totp") > -1) {
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

      const response2fa = await getCode2FAFacebook(
        action?.twoFA?.replace(/\s+/g, "")
      );
      const totpPin2FA = response2fa.token || "";

      await userTypeEnter(action.pid, "input[name='totpPin']", totpPin2FA);
    } else if (url.indexOf("challenge/kpe") > -1) {
      async function enterMail(mail) {
        let enterMail = mail || emailRecovery;
        let emailInput = document.querySelector("input[name='email']");
        if (emailInput != null) {
          await userTypeEnter(action.pid, "input[name='email']", enterMail);
        } else {
          emailInput = document.querySelector("input[type='email']");
          if (emailInput != null) {
            await userTypeEnter(action.pid, "input[type='email']", enterMail);
          }
        }
      }

      await enterMail();

      await sleep(180000);
    } else if (url.indexOf("gds.google.com/web/recoveryoptions") > -1) {
      await sleep(1500);
      const cancelBtn = getElementContainsInnerText(
        "span",
        ["Cancel"],
        "",
        "equal"
      );

      if (cancelBtn) {
        await userClick(action.pid, "cancelBtn", cancelBtn);
      }
    } else if (url.indexOf("gds.google.com/web/chip") > -1) {
      await sleep(1500);
      const notNow = getElementContainsInnerText(
        "span",
        ["Not now"],
        "",
        "equal"
      );

      if (notNow) {
        await userClick(action.pid, "notNow", notNow);
      }
    } else if (url.indexOf("myaccount.google.com") > -1) {
      await goToLocation(action.pid, "https://studio.youtube.com ");
    } else if (url.indexOf("v3/signin/challenge/recaptcha") > -1) {
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "recaptcha"
      );
    }
  } catch (error) {
    console.log("handleLoginGoogle", error);
  }
}

async function advancedFeatures(action) {
  try {
    await sleep(5000);

    const dismissButton = document.querySelector("#dismiss-button");
    if (dismissButton) {
      await userClick(action.pid, "dismissButton", dismissButton);
      await sleep(1500);
    }

    const settingsItem = document.querySelector("#settings-item");
    if (settingsItem) {
      await userClick(action.pid, "settingsItem", settingsItem);
      await sleep(3000);
    }

    const channelSettings = document.querySelector("#channel");
    if (channelSettings) {
      await userClick(action.pid, "channelSettings", channelSettings);
      await sleep(3000);
    }

    const featureEligibility = document.querySelectorAll(
      "#tabsContent tp-yt-paper-tab"
    )[2];

    if (featureEligibility) {
      await userClick(action.pid, "featureEligibility", featureEligibility);
      await sleep(3000);
    }

    // end

    const accessFeatures = document.querySelector("#access-features");
    if (!accessFeatures) {
      console.log("Stop");
      // cho dừng
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "khong co buoc 3"
      );
      return;
    }

    const checkComplete = document.querySelectorAll(
      "ytcp-badge[state='complete']"
    );

    console.log("checkComplete.length", checkComplete.length);
    if (checkComplete.length == 1) {
      console.log("ok 1");

      const expandBtn = document.querySelectorAll(
        "ytcp-icon-button[aria-label='Expand']"
      )[1];
      await userClick(action.pid, "expandBtn", expandBtn);
      await sleep(1000);

      const VerifyPhone = document.querySelector(
        'button[aria-label="Verify phone number"]'
      );

      if (VerifyPhone) {
        await userClick(action.pid, "VerifyPhone", VerifyPhone);
      }
    } else if (checkComplete.length === 2) {
      console.log("ok 3");

      const expandBtn = document.querySelectorAll(
        "ytcp-icon-button[aria-label='Expand']"
      )[2];
      await userClick(action.pid, "expandBtn", expandBtn);
      await sleep(1000);

      await userClick(action.pid, "accessFeatures", accessFeatures);
      await sleep(1000);
      const takeAa6Second = document
        .querySelector("#selected-requirement")
        .querySelector("#radioContainer");
      if (takeAa6Second)
        await userClick(action.pid, "takeAa6Second", takeAa6Second);
      await sleep(1000);

      const nextBtn = document.querySelector("#primary-action-button");
      if (nextBtn) await userClick(action.pid, "nextBtn", nextBtn);

      const getMail = document.querySelector("button[aria-label='Get email']");
      if (getMail) await userClick(action.pid, "getMail", getMail);

      await sleep(2000);
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "đã gửi mail xác thực mặt"
      );
    } else if (checkComplete.length === 3) {
      console.log("Loi");
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "Đã xác thực 3 bước"
      );
    }
  } catch (error) {
    console.log("error", error);
  }
}

async function handleCreate2FA(action) {
  let url = window.location.toString();
  try {
    console.log("Looxi");
    if (
      url.indexOf(
        "https://myaccount.google.com/two-step-verification/authenticator"
      ) > -1
    ) {
      if (
        document.querySelector(
          'button[aria-label="Remove Google Authenticator"]'
        )
      ) {
        await goToLocation(
          action.pid,
          "https://myaccount.google.com/signinoptions/twosv"
        );
      }

      const setUpAuthenticator = getElementContainsInnerText(
        "span",
        ["Set up authenticator"],
        "",
        "equal"
      );
      if (setUpAuthenticator) {
        await userClick(action.pid, "setUpAuthenticator", setUpAuthenticator);
        await sleep(2000);
      }

      const cantScanItBtn = document
        .querySelector("center")
        .querySelector("div");
      if (cantScanItBtn) {
        await userClick(action.pid, "cantScanItBtn", cantScanItBtn);
        await sleep(1000);
      }

      // Lấy 2fa
      const twoFA = document
        .querySelectorAll(".mzEcT strong")[2]
        .textContent.replace(/\s/g, "");
      const nextBtn = getElementContainsInnerText(
        "span",
        ["Next"],
        "",
        "equal"
      );

      if (nextBtn) {
        await userClick(action.pid, "nextBtn", nextBtn);
        await sleep(1000);
      }

      // Nhập token 2fa
      const response2fa = await getCode2FAFacebook(twoFA);
      console.log("fafafa", twoFA, response2fa);

      const totpPin2FA = response2fa.token || "";
      // Gửi mã để lưu lại

      await userTypeEnter(
        action.pid,
        "input[placeholder='Enter Code']",
        totpPin2FA
      );
      await sleep(3000);

      await updateProfileData({
        pid: action.pid,
        twoFA: twoFA,
      });

      await goToLocation(
        action.pid,
        "https://myaccount.google.com/signinoptions/twosv"
      );
    } else if (
      url.indexOf("https://myaccount.google.com/signinoptions/twosv") > -1
    ) {
      const turnOn = document.querySelector(
        'button[aria-label="Turn on 2-Step Verification"]'
      );
      if (turnOn) {
        await userClick(action.pid, "turnOn", turnOn);
        await sleep(1000);
      } else {
        await goToLocation(action.pid, "https://myaccount.google.com ");
      }

      const btnSkip = document.querySelector('button[aria-label="Skip"]');

      if (btnSkip) {
        await userClick(action.pid, "btnSkip", btnSkip);
        await sleep(1000);
      }

      const btnContinueAnyway = document.querySelector(
        'button[aria-label="Continue anyway"]'
      );
      if (btnContinueAnyway) {
        await userClick(action.pid, "btnContinueAnyway", btnContinueAnyway);
        await sleep(3000);
      }
      await goToLocation(action.pid, "https://myaccount.google.com ");
      // kết thúc thêm 2fa
    }
  } catch (error) {
    action.data_reported = error;
    reportScript(action, false);
  }
}
