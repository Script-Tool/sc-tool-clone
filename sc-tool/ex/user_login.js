let LOGIN_STATUS = {
  ERROR: 0,
  SUCCESS: 1,
};

async function userLogin(action) {
  try {
    if (action.is_processing_bat) {
      return;
    }

    await sleep(5000);
    reportLive(action.pid);

    if (action.is_start_handle_rename_channel) {
      await renameChannel(action);
      return;
    }

    let url = window.location.toString();

    let rs = await checkRestricted(action);
    if (!rs) {
      return;
    }

    if (url.includes("https://gds.google.com/web/recoveryoptions")) {
      await userClick(action.pid, "button[aria-label='Cancel']");
      await sleep(2000);
    }

    if (url.includes("https://gds.google.com/web/chip")) {
      let notNowBtn = getElementContainsInnerText(
        "span",
        ["Not now"],
        "",
        "equal"
      );
      await userClick(action.pid, "notNowBtn", notNowBtn);
      await sleep(2000);
    }

    if (url.includes("https://gds.google.com/web/homeaddress")) {
      let skipBtn = getElementContainsInnerText("span", ["Skip"], "", "equal");
      await userClick(action.pid, "skipBtn", skipBtn);
      await sleep(2000);
    }

    if (
      url.indexOf("accounts.google.com/b/0/PlusPageSignUpIdvChallenge") > -1
    ) {
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "VERY"
      );
      return;
    }

    if (url.indexOf("accounts.google.com/b/0/PlusPageSignUp") > -1) {
      await userCreateChannel(action);
      return;
    }

    // Kênh bị bị khóa
    if (url.indexOf("studio.youtube.com/channel-appeal") > -1) {
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, url);
      return;
    }

    if (url.indexOf("studio.youtube.com") > -1) {
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

      await sleep(16000);
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
      return;
    }

    if (url.indexOf("https://consent.youtube.com/m") > -1) {
      try {
        let btnRejectAll = document.querySelectorAll("form").item(1);
        if (btnRejectAll) {
          await userClick(action.pid, "btnRejectAll", btnRejectAll);
        } else {
          await goToLocation(action.pid, "accounts.google.com");
          await sleep(60000);
        }
        return;
      } catch (error) {
        console.log(error);
      }
    }

    if (
      url.indexOf("localhost") > 0 ||
      url.indexOf("https://accounts.google.com/signin/v2/identifier") == 0
    )
      await sleep(10000);
    let emailRecovery = action.recover_mail;
    let recoverPhone = action.recover_phone;
    if (url.includes("youtube.com/channel/") && action.check_create_channel) {
      await updateProfileData({
        pid: action.pid,
        channel_link: url,
      });
      await beforeLoginSuccess(action);
      return;
    }
    if (url == "https://www.youtube.com/") {
      await sleep(5000);

      let avatar =
        document.querySelector("#avatar-btn") || document.querySelector("#img");

      let checkCreateChannel =
        getElementContainsInnerText(
          "span",
          [
            "Create channel",
            "CREATE CHANNEL",
            "TẠO KÊNH",
            "চ্যানেল তৈরি করুন",
            "Tạo kênh",
          ],
          "",
          "equal"
        ) || document.querySelector("#create-channel-button");
      if (checkCreateChannel) {
        await userClick(action.pid, "checkCreateChannel", checkCreateChannel);
        await sleep(60000);
      }

      if (avatar) {
        await beforeLoginSuccess(action);
        return;
      }

      let signinBtn = document.querySelector(
        'ytd-button-renderer > a[href^="https://accounts.google.com/ServiceLogin"]'
      );
      if (signinBtn) {
        await goToLocation(action.pid, "accounts.google.com");
        await sleep(60000);
      }

      let createChannelLayer = document.querySelectorAll(
        '.button-layer a yt-formatted-string[id="text"]'
      );
      if (createChannelLayer) {
        let createChannelBtn = createChannelLayer.item(1);
        if (createChannelBtn) {
          await userClick(action.pid, "createChannelBtn", createChannelBtn);
          await sleep(15000);
        }
      }
      // else {
      //     if (action.isCreateChannel) {
      //         await goToLocation(action.pid, 'youtube.com/create_channel')
      //         await sleep(15000)
      //     }
      // }
    }

    if (url.indexOf("/challenge/iap/verify") > -1) {
      let phoneRs = await getPhoneCode(action.order_id, action.api_name);
      if (phoneRs.error || action.entered_code) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "[getPhoneCode] " + phoneRs.error
        );
      } else {
        action.entered_code = true;
        await setActionData(action);
        let code = phoneRs.code + "";
        if (code.length == 5) {
          code = "0" + code;
        }
        await userTypeEnter(action.pid, "#idvAnyPhonePin", code);
        await sleep(30000);
      }
    } else if (action.allow_verify && url.indexOf("/challenge/iap") > -1) {
      let phoneRs = await getPhone();
      if (phoneRs.error || action.entered_phone) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "[getPhone] " + phoneRs.error
        );
      } else {
        if (phoneRs.err) {
          phoneRs = await getPhone();
        }

        action.order_id = phoneRs.orderID;
        action.api_name = phoneRs.api_name;
        action.entered_phone = true;
        await setActionData(action);

        if (phoneRs.phone.startsWith("0")) {
          phoneRs.phone = phoneRs.phone.replace("0", "+84");
        } else if (!phoneRs.phone.startsWith("+84")) {
          phoneRs.phone = "+84" + phoneRs.phone;
        }
        await userTypeEnter(action.pid, "#phoneNumberId", phoneRs.phone);
        await sleep(30000);
      }
    } else if (url.indexOf("https://myaccount.google.com/u/5/language") > -1) {
      await goToLocation(action.pid, "youtube.com/feed/history");
      await sleep(30000);
    } else if (url.indexOf("myaccount.google.com/language") > -1) {
      // if (action.allow_verify) {
      //     await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, "verify_ok")
      //     return
      // }

      if (!getElementContainsInnerText("div", "Preferred Language")) {
        try {
          let editBtn = document
            .querySelectorAll("button[data-use-native-focus-logic]")
            .item(0);

          await userClick(action.pid, "editBtn", editBtn);
          await sleep(2000);
          await userType(action.pid, "label input", "english");
          await userClick(action.pid, 'li[lang="en"]');
          await userClick(action.pid, 'li[aria-label="United States"]');

          let ok = document
            .querySelectorAll(
              'div[data-is-touch-wrapper="true"] button[data-mdc-dialog-action]'
            )
            .item(2);
          await userClick(action.pid, "ok", ok);
          await sleep(3000);
        } catch (error) {
          console.log("Looxi ", error);
        }
      }
      await goToLocation(action.pid, "youtube.com/feed/history");
      await sleep(30000);
    } else if (
      action.id == "change_pass" &&
      url.indexOf("myaccount.google.com/security-checkup-welcome") > -1
    ) {
      await beforeLoginSuccess(action);
      return;
    } else if (
      action.id == "change_pass" &&
      url.indexOf("myaccount.google.com/signinoptions/password") > -1
    ) {
      action.new_password = makeid(10);
      await userType(action.pid, 'input[name="password"]', action.new_password);
      await userTypeEnter(
        action.pid,
        'input[name="confirmation_password"]',
        action.new_password
      );
      await setActionData(action);
      await updateProfileData({
        pid: action.pid,
        temp_new_pass: action.new_password,
      });

      await sleep(10000);
      let confirmBtn = document.querySelector('[data-mdc-dialog-action="ok"]');
      if (confirmBtn) {
        await userClick(action.pid, "confirmBtn", confirmBtn);
      }
      return;
    } else if (
      action.id == "change_pass" &&
      url.indexOf("/speedbump/changepassword") > -1
    ) {
      action.new_password = makeid(10);
      await userType(action.pid, 'input[name="Passwd"]', action.new_password);
      await userTypeEnter(
        action.pid,
        'input[name="ConfirmPasswd"]',
        action.new_password
      );
      await setActionData(action);
      await updateProfileData({
        pid: action.pid,
        temp_new_pass: action.new_password,
      });

      await sleep(10000);
      let confirmBtn = document.querySelector('[data-mdc-dialog-action="ok"]');
      if (confirmBtn) {
        await userClick(action.pid, "confirmBtn", confirmBtn);
      }
      return;
    } else if (
      action.id == "recovery_mail" &&
      url.indexOf("/disabled/appeal/confirmation") > -1
    ) {
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "recovery_ok"
      );
      return;
    } else if (
      action.id == "recovery_mail" &&
      url.indexOf("/disabled/appeal/contactaddress") > -1
    ) {
      if (document.querySelector("input")) {
        await userTypeEnter(action.pid, "input", action.contact_mail);
        return;
      }
    } else if (
      /**
       * kháng mail
       */
      action.id == "recovery_mail" &&
      url.indexOf("/disabled/appeal/additionalinformation") > -1
    ) {
      if (document.querySelector("textarea")) {
        await userTypeEnter(
          action.pid,
          "textarea",
          action.comment ||
            `I received an email notifying me of the account lockout, but I believe the reason given is incorrect.
I don't take any action within Google account services.
I suspect my account may have been accessed without authorization, resulting in activities I did not perform.
The locking system may be defective.
I commit to ending Google's terms of service and will take the necessary steps to protect my account from future unauthorized access.
I request Google to reconsider my case and unblock my Gmail account as soon as possible. Losing access to this account has caused significant inconvenience for me, as it involves many other important services.`
        );
        return;
      }
    } else if (
      action.id == "recovery_mail" &&
      url.indexOf("/disabled/appeal/reviewconsent") > -1
    ) {
      if (document.querySelector("button")) {
        await userClick(action.pid, "button");
        return;
      }
    } else if (
      action.id == "recovery_mail" &&
      url.indexOf("/disabled/explanation") > -1
    ) {
      //

      if (document.querySelector("button")) {
        await userClick(action.pid, "button");
        return;
      }
    } else if (
      /** end
       * kháng mail
       */
      url.indexOf("accounts.google.com/speedbump/idvreenable/sendidv") > -1 &&
      action.order_id
    ) {
      //enter code
      let phoneRs = await getPhoneCode(action.order_id, action.api_name);
      if (phoneRs.error || action.entered_code) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          phoneRs.error
        );
      } else {
        action.entered_code = true;
        await setActionData(action);
        await userTypeEnter(action.pid, "#smsUserPin", phoneRs.code);
        await sleep(30000);
      }
    } else if (
      url.indexOf("accounts.google.com/speedbump/idvreenable") > -1 &&
      action.is_ver_mail_type
    ) {
      //enter phone number
      let phoneRs = await getPhone();
      if (phoneRs?.error || action?.entered_phone) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "[get phone]" + phoneRs.error
        );
      } else {
        if (phoneRs?.err) {
          phoneRs = await getPhone();
        }

        let inputAction = "";

        switch (action?.phone_country) {
          case "0":
            inputAction = "choose_russian";
            break;
          case "187":
            inputAction = "";
            break;
          case "10":
            inputAction = "choose_vietnam";
            break;
          case "16":
            inputAction = "choose_unitedkingdom";
            break;
          case "4":
            inputAction = "choose_philippines";
            break;
          case "7":
            inputAction = "choose_malaysia";
            break;
          case "63":
            inputAction = "choose_czechrepublic";
            break;
          case "31":
            inputAction = "choose_southafrica";
            break;
          case "11":
            inputAction = "choose_kyrgyzstan";
            break;
          case "40":
            inputAction = "choose_uzbekistan";
            break;
          case "6":
            inputAction = "choose_indonesia";
            break;
          case "36":
            inputAction = "choose_canada";
            break;
          default:
            inputAction = `choose_${action?.phone_country}`;
            break;
        }

        if (inputAction) {
          await userClick(action.pid, "select");
          await updateUserInput(
            action.pid,
            inputAction,
            0,
            0,
            0,
            0,
            "",
            inputAction
          );
        }

        action.order_id = phoneRs.orderID;
        action.api_name = phoneRs.api_name;
        action.entered_phone = true;
        await setActionData(action);
        await userTypeEnter(action.pid, "#deviceAddress", phoneRs.phone);

        if (document.querySelector("#error")) {
          // lạp lại
        }

        await sleep(30000);
      }
    } else if (url.indexOf("https://myaccount.google.com/security") > -1) {
      if (!action.newRecoveryMail) {
        await userClick(action.pid, 'a[href^="recovery/email"]');
      }
      if (!action.newPassword) {
        await userClick(action.pid, 'a[href^="signinoptions/password"]');
      } else {
        await beforeLoginSuccess(action);
      }
      return;
    } else if (
      url.indexOf("https://myaccount.google.com/signinoptions/password") > -1
    ) {
      let newPassword =
        Math.random().toString(36).slice(9).toLocaleUpperCase() +
        Math.random().toString(36).slice(randomRanger(2, 5));
      action.newPassword = newPassword;
      await setActionData(action);
      await userType(action.pid, 'input[name="password"]', newPassword);
      await sleep(randomRanger(3, 5) * 1000);
      await userType(
        action.pid,
        'input[name="confirmation_password"]',
        newPassword
      );
      await sleep(randomRanger(3, 5) * 1000);
      await userClick(action.pid, 'button[type="submit"]');
      await sleep(10000);
      await beforeLoginSuccess(action);
      return;
    } else if (url.indexOf("youtube.com/oops") > -1) {
      await goToLocation(
        action.pid,
        "youtube.com?skip_registered_account_check=true"
      );
      await sleep(15000);
    } else if (url.indexOf("consent.youtube.com") > -1) {
      await sleep(2000);
      await userScroll(action.pid, 5);
      let btnElement = document
        .querySelectorAll("div[data-is-touch-wrapper] > button")
        .item(1);
      if (btnElement) {
        await userClick(action.pid, "arrgre consent.youtube.com", btnElement);
        await sleep(30000);
      }
      throw "consent.youtube.com";
    } else if (
      url.indexOf("https://accounts.google.com/signin/v2/identifier") > -1 ||
      url.indexOf("https://accounts.google.com/v3/signin/identifier") > -1
    ) {
      if (["vivaldi-stable", "vivaldi"].includes(action.browser_name)) {
        let xPos =
          window.outerWidth / 2 +
          (window.screen.width - window.screen.availWidth) -
          194;
        let yPos = 339;
        if (action.os_vm == "vps") {
          yPos = 317;
        }
        await await updateUserInput(
          action.pid,
          "CLICK",
          xPos,
          yPos,
          0,
          0,
          "",
          "close vival btn"
        );
      }

      await waitForSelector("#identifierId");
      await userTypeEnter(action.pid, "#identifierId", action.email);
      await sleep(180000);
    } else if (
      url.indexOf("accounts.google.com/b/0/PlusPageSignUpIdvChallenge") > -1
    ) {
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        "PlusPageSignUpIdvChallenge"
      );
      throw "PlusPageSignUpIdvChallenge";
    } else if (
      url.indexOf("https://accounts.google.com/ServiceLogin/signinchooser") == 0
    ) {
      await waitForSelector("ul li[class]");
      let list = [...document.querySelectorAll("ul li[class]")];
      await userClick(action.pid, "ul li[class]", list[list.length - 2]);
      await sleep(60000);
    } else if (
      url.indexOf("https://accounts.google.com/ServiceLogin/identifier") == 0
    ) {
      if (action.backup && !action.retry_backup) {
        action.retry_backup = true;
        await setActionData(action);
        await goToLocation(action.pid, "accounts.google.com");
        return;
      }
      await waitForSelector("#identifierId");
      document.querySelector("#identifierId").value = "";
      await userTypeEnter(action.pid, "#identifierId", action.email);
      await sleep(190000);
    } else if (
      url.indexOf("accounts.google.com/v3/signin/challenge/pwd") > -1
    ) {
      action.relogin = true;
      await setActionData(action);
      await waitForSelector("input[name='Passwd']");
      await userTypeEnter(action.pid, "input[name='Passwd']", action.password);
      await sleep(190000);
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
    } else if (
      url.indexOf("accounts.google.com/signin/v2/challenge/pwd") > -1
    ) {
      action.relogin = true;
      await setActionData(action);
      await waitForSelector("input[name='password']");
      await userTypeEnter(
        action.pid,
        "input[name='password']",
        action.password
      );
      await sleep(190000);
    } else if (url.indexOf("accounts.google.com/signin/v2/sl/pwd") > -1) {
      const msgEle = document.querySelector("div[aria-live='assertive']");
      if (msgEle && msgEle.textContent.trim().length) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "Invalid Password: " + msgEle.textContent.trim()
        );
        return;
      }
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

      if (document.querySelector('div[data-challengeid="2"]')) {
        await userClick(action.pid, 'div[data-challengeid="2"]');
        return;
      }
      let Unavailable = getElementContainsInnerText("em", [
        "Unavailable because of too many attempts. Please try again later",
      ]);
      if (Unavailable) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "Unavailable because of too many attempts"
        );
        return;
      }
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

      await sleep(180000);
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

      if (action.scan_check_recovery) {
        let wrapRecoMail = getElementContainsInnerText(
          "div",
          ["Confirm the recovery email address you added to your account: "],
          "",
          "equal"
        );
        let recoMail = "";
        let firstChar = "";
        if (wrapRecoMail) {
          recoMail = wrapRecoMail.querySelector("strong").innerText;
          if (recoMail) {
            let startStr = "";
            for (var i = 0; i < recoMail.length; i++) {
              if (recoMail[i] == "•") {
                startStr += "•";
              }
            }
            firstChar = recoMail.split(startStr)[0] || "-";
            recoMail = recoMail.replace(startStr, `.{${startStr.length}}`);
          }

          if (emailRecovery.startsWith(firstChar)) {
            await enterMail();
            await sleep(5000);
          }

          if (wrapRecoMail) {
            let match = `^${recoMail}$`;

            let rs = await getRecoMails(match, action.pid);
            if (rs && rs.emails) {
              for await (let mail of rs.emails) {
                action.current_reco_mail = mail;
                await setActionData(action);
                await enterMail(mail);
              }
            }
          }
        }
      } else {
        await enterMail();
        await sleep(2000);
      }

      await sleep(180000);
    } else if (url.indexOf("challenge/kpp") > -1) {
      let phoneInput = document.querySelector("input#phoneNumberId");
      if (phoneInput != null) {
        await userTypeEnter(action.pid, "input#phoneNumberId", recoverPhone);
      } else {
        phoneInput = document.querySelector("input[type='tel']");
        if (phoneInput != null) {
          await userTypeEnter(action.pid, "input#phoneNumberId", recoverPhone);
        }
      }
      await sleep(60000);
    } else if (
      url.indexOf("https://accounts.google.com/signin/privacyreminder") > -1
    ) {
      while (document.querySelector('[role="button"][jsshadow]')) {
        await userClick(action.pid, '[role="button"][jsshadow]');
        await sleep(15000);
      }
    } else if (url.indexOf("accounts.google.com/speedbump/gaplustos") > -1) {
      await userClick(action.pid, 'input[type="submit"]');
      await sleep(60000);
    }
    // Bật xác thực 2fa
    else if (
      url.includes(
        "myaccount.google.com/two-step-verification/authenticator"
      ) ||
      url.includes("myaccount.google.com/signinoptions/twosv")
    ) {
      await handleCreate2FA(action);
      return;
    } else if (
      action.client_config_threeStepVerificationNoDelete &&
      url.indexOf("youtube.com/verify_phone_number") > -1
    ) {
      await verify_phone_number2(action);
      // return
    } else if (
      url.indexOf("https://www.youtube.com/channel/") > -1 ||
      url.indexOf("https://www.youtube.com/user/") > -1 ||
      url.indexOf("m.youtube.com/feed/library") > -1
    ) {
      await updateProfileData({
        pid: action.pid,
        channel_link: url,
      });
      await goToLocation(action.pid, "youtube.com/feed/history");
      return;
    } else if (
      url.indexOf("https://m.youtube.com/channel/") == 0 ||
      url.indexOf("https://m.youtube.com/user/") == 0 ||
      url.indexOf("https://m.youtube.com/c/") == 0
    ) {
      await beforeLoginSuccess(action); // login success
      return;
    } else if (
      url.indexOf("myactivity.google.com/product/youtube") > -1 ||
      url.indexOf("myactivity.google.com/product/youtube/controls") > -1
    ) {
      await pauseHistory(action);
      return;
    } else if (url.indexOf("myactivity.google.com/activitycontrols") > -1) {
      await pauseInfo(action);
      return;
    } else if (url.indexOf("https://m.youtube.com/create_channel") == 0) {
      await createChannelMobile(action);
      return;
    } else if (
      url.indexOf("https://myaccount.google.com/gender") == 0 ||
      url.indexOf("https://myaccount.google.com/birthday") == 0
    ) {
      await updateInfo(action);
      return;
    } else if (url.indexOf("youtube.com/feed/history") > -1) {
      await oldPauseHistory(action);
      if (action.id == "reg_user") {
        await handleLoginSuccess(action);
      } else {
        await goToLocation(action.pid, "myactivity.google.com/product/youtube");
      }

      //await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS)
      return;
    } else if (url.indexOf("accounts.google.com/b/0/PlusPageSignUp") > -1) {
      await userCreateChannel(action);
      return;
    } else if (url.indexOf("youtube.com/account") > -1) {
      if (action.id == "reg_user" && !action.login_success) {
        action.login_success = true;
        await setActionData(action);
      }
      let channels = [];
      for (let i = 0; i < 3; i++) {
        const allChannels = document.querySelectorAll(
          "ytd-account-item-renderer"
        );

        const filtered = Array.from(allChannels).filter((element) => {
          const xpath =
            ".//yt-formatted-string[contains(text(), 'No channel')]";
          const noChannel = document.evaluate(
            xpath,
            element,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          return !noChannel; // Chỉ giữ channel mà KHÔNG chứa "No channel"
        });

        if (filtered.length) {
          channels = filtered;
          break;
        }

        await sleep(5000);
      }

      let blockChannels = [];
      // Lặp qua danh sách các phần tử đã chọn
      channels.forEach((element) => {
        // Kiểm tra va lay nhung kenh bi khoa
        const children = element.children[0].children[3];
        if (children && !children.hasAttribute("hidden") && !noChannel) {
          blockChannels.push(element);
        }
      });

      if (channels.length) {
        // update users count to server
        updateTotalCreatedUsers(
          action.pid,
          channels.length,
          blockChannels.length
        );
      }

      if (action.id == "reg_user") {
        let btnCreateChannel = document.querySelector(
          "#contents ytd-button-renderer yt-button-shape"
        );
        if (!btnCreateChannel) {
          await sleep(7000);
          btnCreateChannel = document.querySelector(
            "#contents ytd-button-renderer yt-button-shape"
          );
        }

        if (channels.length < 100 && btnCreateChannel) {
          await userClick(action.pid, "", btnCreateChannel);
        } else {
          await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
        }
      } else {
        if (isRunBAT) {
          action.is_processing_bat = true;
          await setActionData(action);
          await handleBeforeTrickAds(action);
        }

        if (action.client_config_threeStepVerificationNoDelete) {
          await goToLocation(action.pid, "youtube.com/verify_phone_number");
        } else {
          await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
        }
      }

      return;
    } else if (
      url.indexOf("gds.google.com/web/recoveryoptions") > -1 &&
      action.is_ver_mail_type
    ) {
      let msg = "verify_success";
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, msg);
    } else if (url != window.location.toString()) {
      return;
    }
    if (
      url.indexOf("accounts.google.com/signin/newfeatures") > -1 ||
      url == "https://myaccount.google.com/" ||
      url.indexOf("https://myaccount.google.com/?") > -1 ||
      url.indexOf("RecycledEmailInterstitial") > -1 ||
      url.indexOf("gds.google.com/web/chip") > -1 ||
      url.indexOf("accounts.google.com/speedbump/gaplustos") > -1 ||
      url.indexOf("myaccount.google.com/security-checkup-welcome") > -1 ||
      url.indexOf("youtube.com/") > -1 ||
      url.indexOf("gds.google.com/web/recoveryoptions") > -1
    ) {
      if (false && !action.updateInfo) {
        action.updateInfo = true;
        await setActionData(action);
        await goToLocation(action.pid, "myaccount.google.com/gender");
      } else {
        {
          await beforeLoginSuccess(action); // login success
        }
        return;
      }
    } else {
      await sleep(15000);
      // gửi lại email khôi phục
      if (
        action.current_reco_mail &&
        (url.includes("support.google.com/accounts/answer/40039") ||
          url.includes("myaccount.google.com"))
      ) {
        await updateProfileData({
          pid: action.pid,
          recovery_mail: action.current_reco_mail,
        });
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "scan_reco_mail_success"
        );
        return;
      } else if (
        url.includes("support.google.com/accounts/answer/40039") &&
        action.only_run_login
      ) {
        await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
      }

      if (!url.includes("challenge/iap/verify")) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "[else]" + getLoginError()
        );
      }
    }
  } catch (e) {
    console.log("Looi", e);
    // await updateActionStatus(
    //   action.pid,
    //   action.id,
    //   LOGIN_STATUS.ERROR,
    //   "[catch error] " + e.toString()
    // );
  }
}

async function beforeLoginSuccess(action) {
  // chỉ login
  if (action.only_run_login) {
    await goToLocation(action.pid, "support.google.com/accounts/answer/40039");
    return;
  }

  if (!action.check_create_channel) {
    action.check_create_channel = true;
    await setActionData(action);
    await goToLocation(action.pid, "youtube.com/feed/history");
    return;
  } else {
    action.check_create_channel = false;
    await setActionData(action);
  }

  // gửi lại email khôi phục
  if (action.current_reco_mail) {
    await updateProfileData({
      pid: action.pid,
      recovery_mail: action.current_reco_mail,
    });
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      "scan_reco_mail_success"
    );
    return;
  }

  if (action.id == "change_pass") {
    if (action.new_password) {
      action.username = action.email;
      action.password = action.new_password;
      action.verify = action.recover_mail;
      action.end_script = true;
      await setActionData(action);
      await reportAccount(action);
    } else {
      await goToLocation(
        action.pid,
        "https://myaccount.google.com/signinoptions/password"
      );
      await sleep(20000);
    }
  }

  if (action.id == "reg_account" && action.process_login) {
    action.process_login = false;
    await setActionData(action);
    await goToLocation(action.pid, "https://ads.google.com/home/");
    //await goToLocation(action.pid, 'https://www.google.com/adsense/signup/create?sac=true&pli=1&authuser=0&sac=true')
    return;
  }

  if (action.is_rename_channel_type) {
    action.is_start_handle_rename_channel = true;
    await setActionData(action);
    await goToLocation(
      action.pid,
      "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
    );
  } else if (action.is_ver_mail_type) {
    let msg = action.order_id ? "verify_success" : "account_ok";
    await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, msg);
  } else {
    if (action.skip_pau_history) {
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
    } else {
      await goToLocation(action.pid, "https://myaccount.google.com/language");
    }
  }
  await sleep(60000);

  if (isNonUser) {
    await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
  } else {
    await goToLocation(
      action.pid,
      action.mobile
        ? "https://m.youtube.com/feed/library"
        : "youtube.com/create_channel"
    );
    await sleep(60000);
    await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
  }
}

async function handleLoginSuccess(action) {
  await goToLocation(
    action.pid,
    "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
  );
}

async function checkLogin(action) {
  await waitForSelector(
    "ytd-topbar-menu-button-renderer,.topbar-menu-button-avatar-button"
  );
  if (
    !document.querySelector(
      "#avatar-btn,ytm-topbar-menu-button-renderer .profile-icon-img"
    )
  ) {
    // recheck
    let allowBtn = document.querySelector(
      ".dialog-buttons .consent-bump-button-wrapper button"
    );
    if (allowBtn) {
      await userClick(
        action.pid,
        ".dialog-buttons .consent-bump-button-wrapper button",
        allowBtn
      );
      await sleep(5000);
    }
    if (!action.check_login) {
      action.check_login = true;
      await setActionData(action);
      await goToLocation(action.pid, "accounts.google.com");
    } else {
      return;
    }
  } else if (
    window.location.toString().split("?")[0] == "https://m.youtube.com/"
  ) {
    let iconLength = [...document.querySelectorAll("#home-icon path")].length;
    await updateActionStatus(
      action.pid,
      "login",
      LOGIN_STATUS.SUCCESS,
      iconLength == 3 ? "PREMIUM" : "FREE",
      false
    );
  }
}

async function checkPremium(action) {
  try {
    let url = window.location.toString();
    await waitForSelector(
      "ytd-topbar-menu-button-renderer,.topbar-menu-button-avatar-button"
    );
    if (window.location.toString().split("?")[0] == "https://m.youtube.com/") {
      let iconLength = [...document.querySelectorAll("#home-icon path")].length;
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.SUCCESS,
        iconLength == 3 ? "PREMIUM" : "FREE"
      );
    } else {
      await beforeLoginSuccess(action); // login success
    }
  } catch (e) {
    await beforeLoginSuccess(action); // login success
  }
}

async function checkCountry(action) {
  try {
    let url = window.location.toString();
    if (
      url.indexOf("https://pay.google.com/") == 0 &&
      url.indexOf("settings") > 0
    ) {
      let i = 0;
      while (!action.current_country) {
        i++;
        if (i > 30) throw "GET_COUNTRY";
        let data = await getActionData();
        action = data.action;
        await sleep(2000);
      }
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.SUCCESS,
        action.current_country
      );
    } else if (
      url.indexOf("https://payments.google.com/payments") == 0 &&
      url.indexOf("embedded_settings") > 0
    ) {
      if (
        document.querySelector(
          '[data-title="Country/Region"] .b3id-collapsing-form-summary-text'
        )
      ) {
        await waitForSelector(
          '[data-title="Country/Region"] .b3id-collapsing-form-summary-text'
        );
        let country = document.querySelector(
          '[data-title="Country/Region"] .b3id-collapsing-form-summary-text'
        ).textContent;
        action.current_country = country;
        await setActionData(action);
      }
    } else {
      await beforeLoginSuccess(action); // login success
    }
  } catch (e) {
    await beforeLoginSuccess(action); // login success
  }
}

function getLoginError() {
  let url = window.location.toString().split("?")[0];
  try {
    let msg;
    if (url.indexOf("/v2/identifier") > -1) {
      if (document.querySelector('#captchaimg[src*="Captcha"]')) {
        msg = "CAPTCHA";
      }
    } else if (url.indexOf("/v2/challenge/pwd") > -1) {
      if (document.querySelector('#captchaimg[src*="Captcha"]')) {
        msg = "CAPTCHA";
      } else {
        msg = document.querySelector('div[aria-live="assertive"]').textContent;
      }
    } else if (url.indexOf("/v2/challenge/kpe") > -1) {
      msg = document.querySelector(
        'div[aria-live="assertive"][class]'
      ).textContent;
    } else if (url.indexOf("/v2/deniedsigninrejected") > -1) {
      msg = document.querySelector("#headingText").textContent;
    } else if (url.indexOf("/v2/challenge/ipp") > -1) {
      msg = "CODE_TO_MOBILE";
    } else if (url.indexOf("/v2/challenge/ipp") > -1) {
      msg = "CALLING_VERIFICATION";
    } else if (url.indexOf("/v2/challenge/sq") > -1) {
      msg =
        "SECURITY_QUESTION:" +
        document.querySelector('div[aria-live="assertive"]').textContent;
    } else if (
      url.indexOf("/signin/selectchallenge") > -1 ||
      url.indexOf("/v2/challenge/selection") > -1
    ) {
      let challenges = Array.from(
        document.querySelectorAll(
          '[data-challengetype]:not([data-challengetype="undefined"])'
        )
      )
        .map((e) => e.getAttribute("data-sendmethod"))
        .join(",");
      msg = "UNKNOWN_CHALLENGE_TYPE:" + challenges;
    }
    return url + ":" + msg;
  } catch (e) {
    return url + ":" + e.toString();
  }
}

async function userCreateChannel(action) {
  let fullname = await randomFullName();
  await waitForSelector("#labelAndInputContainer");
  const inputName = document.querySelector(
    "#title-input #labelAndInputContainer"
  );

  await userTypeEnter(action.pid, "input", fullname, inputName);

  await sleep(4000);
  const create_channel = document.querySelector(
    'button[aria-label="Create channel"]'
  );
  await userClick(action.pid, "create_channel", create_channel);

  // let fullname = await randomFullName()
  // await waitForSelector('#PlusPageName')
  // await userTypeEnter(action.pid, '#PlusPageName', fullname)
  // await sleep(1000)
  // await userClick(action.pid,'.consent-checkmark')

  // await updateUserInput(pid,'CTR_DOWN')
  // await userClick(action.pid,'#submitbutton')
  // await userClick(action.pid,'.consent-checkmark')
  // await userClick(action.pid,'.consent-checkmark')
  // await userClick(action.pid,'#submitbutton')

  // await sleep(1000)
  // await userClick(action.pid,'.consent-checkmark')
  // await userClick(action.pid,'.consent-checkmark')

  // await userClick(action.pid,'#submitbutton')
  // await sleep(1000)
  // await userClick(action.pid,'.consent-checkmark')
  // await userClick(action.pid,'.consent-checkmark')

  // await updateUserInput(pid,'CTR_UP')

  // await sleep(1000)
}

async function createChannelMobile(action) {
  await sleep(5000);
  for (let i = 0; i < 5; i++) {
    if (document.querySelector('[data-style="STYLE_PRIMARY"]')) break;
    await sleep(2000);
  }
  let firstName = document.querySelector('input[dir="auto"]');
  if (firstName && !firstName.value) {
    await userType(action.pid, 'input[dir="auto"]', randomString(), firstName);
  }
  let lastName = document.querySelector(
    "input.ytm-create-core-identity-channel-content-renderer-family-name-input"
  );
  if (lastName && !lastName.value) {
    await userType(
      action.pid,
      "input.ytm-create-core-identity-channel-content-renderer-family-name-input",
      randomString(),
      lastName
    );
  }
  await userClick(action.pid, '[data-style="STYLE_PRIMARY"]');
  await sleep(10000);
  await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
}

async function updateInfo(action) {
  let url = window.location.toString();
  try {
    if (url.indexOf("gender") > -1) {
      if (document.querySelector('[name="c1"][value="4"][checked]')) {
        await userClick(
          action.pid,
          `[name="c1"][value="${randomRanger(2, 3)}"]`
        );
        await sleep(5000);
      }
    } else if (url.indexOf("birthday") > -1) {
      if (
        ![...document.querySelectorAll('input[type="text"][value]')].filter(
          (x) => x.value
        ).length
      ) {
        await userClick(action.pid, 'div[role="combobox"]');
        await sleep(1000);
        let months = [...document.querySelectorAll("ul li")];
        let randMonth = months[randomRanger(1, months.length - 1)];
        randMonth.scrollIntoView({ block: "center" });
        await userClick(action.pid, "ul li", randMonth);
        await sleep(1000);
        await userType(action.pid, "#i7", randomRanger(1, 30));
        await userType(action.pid, "#i9", randomRanger(1980, 2001));
        await userClick(action.pid, 'button[type="submit"] span');
        await sleep(randomRanger(3, 5) * 1000);
        await userClick(action.pid, 'button[data-mdc-dialog-action="ok"] span');
        await sleep(randomRanger(3, 5) * 1000);
      }
    }
  } catch (e) {
  } finally {
    if (url.indexOf("birthday") > -1) {
      // await updateActionStatus(action.pid,action.id,LOGIN_STATUS.SUCCESS)
      await goToLocation(action.pid, "youtube.com/create_channel");
    } else {
      await goToLocation(action.pid, "myaccount.google.com/birthday");
    }
  }
}

async function pauseInfo(action) {
  try {
    let btnOff = document.querySelector(
      'div[data-is-touch-wrapper] > button[data-is-on="true"]'
    );
    if (btnOff) {
      await userClick(
        action.pid,
        'div[data-is-touch-wrapper] > button[data-is-on="true"]',
        btnOff
      );
      await sleep(1000);
      await userScrollMobile(action.pid, 20);
      let pause = document
        .querySelectorAll(
          "div[jsslot] div[data-is-touch-wrapper] > button > span"
        )
        .item(1);
      if (pause) {
        await userClick(action.pid, "Pause btn", pause);
      }
      await sleep(4000);
    }
  } catch (error) {
  } finally {
    handleLoginSuccess(action);
  }
}

async function pauseHistory(action) {
  try {
    let btnOff = document.querySelector(
      'div[data-is-touch-wrapper] > button[data-is-on="true"]'
    );
    if (btnOff) {
      await userClick(
        action.pid,
        'div[data-is-touch-wrapper] > button[data-is-on="true"]',
        btnOff
      );
      await sleep(1000);
      await userScrollMobile(action.pid, 20);
      let pause = document
        .querySelectorAll(
          "div[jsslot] div[data-is-touch-wrapper] > button > span"
        )
        .item(1);
      if (pause) {
        await userClick(action.pid, "Pause btn", pause);
      }
      await sleep(4000);
    }
  } catch (error) {
  } finally {
    await goToLocation(
      action.pid,
      "https://myactivity.google.com/activitycontrols?time=" + Date.now()
    );
    await sleep(60000);
  }
}

async function oldPauseHistory(action) {
  try {
    let pauseIcon = document.querySelector(
      'ytd-button-renderer path[d="M11,16H9V8h2V16z M15,8h-2v8h2V8z M12,3c4.96,0,9,4.04,9,9s-4.04,9-9,9s-9-4.04-9-9S7.04,3,12,3 M12,2C6.48,2,2,6.48,2,12 s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2L12,2z"]'
    );
    if (!pauseIcon) return;
    await userClick(action.pid, "saved history button", pauseIcon);
    await sleep(4000);
    let historyOnInput = document.querySelector(
      ".yt-confirm-dialog-renderer #confirm-button"
    );
    if (historyOnInput) {
      await userClick(
        action.pid,
        ".yt-confirm-dialog-renderer #confirm-button",
        historyOnInput
      );
      await sleep(4000);
    }
  } catch (e) {}
}

async function changePassword(action) {
  try {
    await sleep(5000);
    let url = window.location.toString();
    if (url.indexOf("https://myaccount.google.com/security") == 0) {
      if (!action.newRecoveryMail) {
        await userClick(action.pid, 'a[href^="recovery/email"]');
      }
      if (!action.newPassword) {
        await userClick(action.pid, 'a[href^="signinoptions/password"]');
      } else {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.SUCCESS,
          "PASSWORD_" + action.newPassword
        );
      }
      return;
    } else if (
      url.indexOf("https://myaccount.google.com/signinoptions/password") == 0
    ) {
      let newPassword =
        Math.random().toString(36).slice(9).toLocaleUpperCase() +
        Math.random().toString(36).slice(randomRanger(2, 5));
      action.newPassword = newPassword;
      await setActionData(action);
      await userType(action.pid, 'input[name="password"]', newPassword);
      await sleep(randomRanger(3, 5) * 1000);
      await userType(
        action.pid,
        'input[name="confirmation_password"]',
        newPassword
      );
      await sleep(randomRanger(3, 5) * 1000);
      await userClick(action.pid, 'button[type="submit"]');
      await sleep(10000);
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.SUCCESS,
        "PASSWORD_" + action.newPassword
      );
      return;
    } else if (
      url.indexOf("https://myaccount.google.com/recovery/email") == 0
    ) {
      let chars = "abcdefghijklmnopqrstuvwxyz";
      let domain = Math.random() < 0.5 ? "@hotmail.com" : "@outlook.com";
      let newRecoveryMail =
        chars[randomRanger(0, chars.length - 1)] +
        Math.random().toString(36).slice(9).toLocaleUpperCase() +
        Math.random().toString(36).slice(randomRanger(2, 5)) +
        domain;
      action.newRecoveryMail = newRecoveryMail;
      await setActionData(action);
      document.querySelector("form input[placeholder]").value = "";
      await userType(action.pid, "form input[placeholder]", newRecoveryMail);
      await sleep(randomRanger(3, 5) * 1000);
      await userClick(action.pid, 'button[type="submit"]');
      await sleep(randomRanger(3, 5) * 1000);
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.SUCCESS,
        "RECOVERYMAIL_" + action.newRecoveryMail,
        false
      );
      await sleep(randomRanger(3, 5) * 1000);
      await goToLocation(action.pid, "myaccount.google.com/security");
      return;
    } else if (
      url.indexOf("accounts.google.com/signin/v2/challenge/pwd") > -1
    ) {
      await userTypeEnter(
        action.pid,
        "input[name='password']",
        action.password
      );
      await sleep(60000);
    } else {
      await beforeLoginSuccess(action); // login success
    }
  } catch (e) {
    await beforeLoginSuccess(action); // login success
  }
}

async function userConfirm(action) {
  try {
    await sleep(5000);
    let url = window.location.toString();
    if (url == "https://families.google.com/families") {
      let leaveFamilyGroup = document.querySelector(
        '[aria-label="Leave family group"],[aria-label="Delete family group"]'
      );
      if (leaveFamilyGroup) {
        leaveFamilyGroup.click();
      } else {
        await goToLocation(action.pid, "gmail.com");
      }
    } else if (
      url.indexOf("https://families.google.com/families/member/") == 0 &&
      url.indexOf("/remove") > 0
    ) {
      let leaveFamilyGroupConfirm = document.querySelector(
        '[role=button][data-removeself="true"]'
      );
      await userClick(
        action.pid,
        '[role=button][data-removeself="true"]',
        leaveFamilyGroupConfirm
      );
    } else if (
      url.indexOf("https://families.google.com/families/delete") == 0
    ) {
      let deleteButton = [
        ...document.querySelectorAll("[data-age] [role=button]"),
      ][1];
      await userClick(action.pid, "[data-age] [role=button]", deleteButton);
    } else if (
      url.indexOf("https://pay.google.com/") == 0 &&
      url.indexOf("settings") > 0
    ) {
      let i = 0;
      while (!action.current_country) {
        i++;
        if (i > 30) throw "GET_COUNTRY";
        let data = await getActionData();
        action = data.action;
        await sleep(2000);
      }
      if (action.current_country != action.country) {
        await userClick(action.pid, "c-wiz a[jsaction][jslog]");
        await sleep(5000);
      } else {
        throw "SAME_COUNTRY";
      }
    } else if (
      url.indexOf("https://payments.google.com/payments") == 0 &&
      url.indexOf("embedded_settings") > 0
    ) {
      if (
        document.querySelector(
          '[data-title="Country/Region"] .b3id-collapsing-form-summary-text'
        )
      ) {
        await waitForSelector(
          '[data-title="Country/Region"] .b3id-collapsing-form-summary-text'
        );
        let country = document.querySelector(
          '[data-title="Country/Region"] .b3id-collapsing-form-summary-text'
        ).textContent;
        if (!country) throw "COUNTRY_UNDEFINED";
        if (country != action.country) {
          action.current_country = country;
          await setActionData(action);
        } else {
          // await goToLocation(action.pid,'gmail.com')
          action.country = "Taiwan (TW)";
          action.current_country = country;
          await setActionData(action);
        }
      }
    } else if (
      url.indexOf("https://payments.google.com/payments/") == 0 &&
      url.indexOf("wipeout") > 0
    ) {
      if (
        document.querySelector(
          '[data-name="closureReasonSelector"] [role="listbox"]'
        )
      ) {
        await waitForSelector(
          '[data-name="closureReasonSelector"] [role="listbox"]'
        );
        document
          .querySelector(".b3id-form-field.b3-simple-form-form-field")
          .remove();
        await sleep(1000);
        //process closing payment profile
        await userClick(
          action.pid,
          '[data-name="closureReasonSelector"] [role="listbox"]'
        );
        await sleep(3000);
        let items = [...document.querySelectorAll(".goog-menu .goog-menuitem")];
        let item = items[randomRanger(0, items.length - 2)];
        item.scrollIntoView({ block: "center" });
        await userSelect(action.pid, randomRanger(1, items.length - 3));
        // await userClick(action.pid,'.goog-menu .goog-menuitem',item)
        await sleep(3000);
        document
          .querySelector(
            '[data-component-name="SIMPLE_FORM"] [role="button"][class*="button-action"]'
          )
          .click();
        await userClick(
          action.pid,
          '[data-component-name="SIMPLE_FORM"] [role="button"][class*="button-action"]'
        );
        await sleep(5000);
        await waitForSelector('[role="button"][class*="primary-button"]');
        await userClick(action.pid, '[role="button"][class*="primary-button"]');
      }
    } else if (url.indexOf("https://support.google.com/pay/") == 0) {
      await goToLocation(action.pid, "pay.google.com");
    } else if (
      url.indexOf("https://pay.google.com/gp/w/u/0/home/signup") == 0
    ) {
      await userClick(action.pid, "c-wiz button div");
    } else if (
      url.indexOf("https://accounts.google.com/signin/v2/challenge/pwd") == 0
    ) {
      await waitForSelector('input[type="password"]');
      document.querySelector('input[type="password"]').value = action.password;
      await sleep(5000);
      document.querySelector("#passwordNext button").click();
    } else if (url.indexOf("https://mail.google.com/") == 0) {
      let webLink = document.querySelector("a");
      if (webLink && webLink.textContent.indexOf("web version") >= 0) {
        await userClick(action.pid, "a", webLink);
        await sleep(5000);
      }
      await waitForSelector('[role="listitem"] div');
      await sleep(5000);
      // check invited
      // let invited = [...document.querySelectorAll('[role="listitem"]')].filter(x => x.textContent.indexOf('Welcome to YouTube Premium') >= 0).length > 0
      // if(invited){
      //     throw 'INVITED'
      // }
      // get invite item
      // search
      await userClick(action.pid, 'input[type="search"]');
      await sleep(2000);
      await userTypeEnter(action.pid, 'input[type="search"]', "invited you");
      await sleep(3000);
      let inviteMail = [
        ...document.querySelectorAll('[role="listitem"]'),
      ].filter((x) => x.textContent.indexOf("invited you") > 0);
      if (inviteMail.length == 0) throw "NO_INVITE_MAIL";
      await userClick(action.pid, "invite mail", inviteMail[0]);
      await sleep(5000);
      await waitForSelector(
        'a[href^="https://families.google.com/"],a[href^="https://notifications.googleapis.com/email/redirect"]'
      );
      let inviteLink = document.querySelector(
        'a[href^="https://families.google.com/"],a[href^="https://notifications.googleapis.com/email/redirect"]'
      );
      await goToLocation(action.pid, inviteLink.href);
    } else if (url.indexOf("https://families.google.com/join/promo") == 0) {
      let familiesLink = document.querySelector(
        '[href="https://myaccount.google.com/preferences#family"]'
      );
      if (familiesLink) throw "INVITED";
      await waitForSelector('div[role="button"] span');
      await userClick(action.pid, 'div[role="button"] span');
    } else if (url.indexOf("https://families.google.com/join/profile") == 0) {
      let joinLink = [
        ...document.querySelectorAll('div[role="button"]'),
      ].filter((x) => x.textContent.toLowerCase().indexOf("join") >= 0);
      if (joinLink.length == 0) throw "JOIN_PROFILE_NO_BUTTON";
      await userClick(action.pid, "join profile button", joinLink[0]);
      await sleep(10000);
      let alertMsg = document.querySelector('[role="alertdialog"] > span');
      if (alertMsg) {
        let joinRetry = !action.country ? 0 : 2;
        if (action.join_wait && action.join_wait > joinRetry)
          throw alertMsg.textContent;
        action.join_wait = action.join_wait ? action.join_wait + 1 : 1;
        await setActionData(action);
        await sleep(30000);
        await goToLocation(action.pid, url);
      }
    } else if (url.indexOf("https://families.google.com/join/done") == 0) {
      await beforeLoginSuccess(action); // login success
    } else if (url.indexOf("https://www.google.com/gmail/about") == 0) {
      await goToLocation(action.pid, "gmail.com");
    } else {
      throw "unknown_url_" + url.split("?")[0];
    }
  } catch (e) {
    console.log("error", e);
    if (
      e.toString().indexOf("different country") > -1 &&
      action.country != "Taiwan (TW)"
    ) {
      // action.country = !action.country ? 'United States (US)':'Taiwan (TW)'
      action.country = !action.country ? "United Kingdom (GB)" : "Taiwan (TW)";
      await setActionData(action);
      await goToLocation(action.pid, "pay.google.com/gp/w/u/0/home/settings");
    } else {
      await updateActionStatus(
        action.pid,
        action.id,
        LOGIN_STATUS.ERROR,
        e.toString() == "INVITED"
          ? "CONFIRM_SUCCESS_INVITED"
          : "CONFIRM_ERROR_" + e.toString()
      );
    }
  }
}

async function updateAvatar(action) {
  try {
    if (
      !document.querySelector(
        '[data-picker="https://docs.google.com/picker"] img[src*="lh3.googleusercontent.com/a-/"]'
      )
    ) {
      let gender =
        document
          .querySelector('a[href="gender"]')
          .textContent.indexOf("Female") >= 0
          ? "female"
          : "male";
      await userClick(
        action.pid,
        '[data-picker="https://docs.google.com/picker"]'
      );
      await sleep(5000);
      let iframe = await waitForSelector(
        'iframe[src^="https://myaccount.google.com/profile-picture"]'
      );
      let buttons = [
        ...iframe.contentWindow.document.querySelectorAll(
          "button .google-material-icons"
        ),
      ];
      await userClick(
        action.pid,
        "button .google-material-icons",
        buttons[0],
        iframe
      );
      await sleep(1000 * randomRanger(4, 6));
      await userSelectAvatar(action.pid, gender);
      await sleep(1000 * randomRanger(5, 7));
      await waitForSelector('[alt="The picture being cropped"]', 30000, iframe);
      await sleep(1000 * randomRanger(3, 5));
      let saveButton = [
        ...iframe.contentWindow.document.querySelectorAll("button"),
      ].filter(
        (x) =>
          x.textContent.indexOf("Save as profile picture") >= 0 &&
          x.getBoundingClientRect().width
      )[0];
      if (!saveButton) throw "NO_SAVE_BUTTON";
      await userClick(action.pid, "button save avatar", saveButton, iframe);
      await sleep(1000 * randomRanger(5, 7));
    }
    await goToLocation(action.pid, "youtube.com//");
  } catch (err) {
    await goToLocation(action.pid, "youtube.com//");
  }
}

async function checkRestricted(action) {
  let url = window.location.toString();

  if (url.includes("youtube.com/channel/")) {
    if (action.client_config_run_check_2fa) {
      if (action.verify_2fa) {
        action.verify_2fa = false;
        await setActionData(action);
        await goToLocation(
          action.pid,
          "https://myaccount.google.com/security?hl=en"
        );
        return;
      } else {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "VERIFY_DONE"
        );
      }
    }
  } else if (url.includes("signin/unknownerror")) {
    let nextBtn = getElementContainsInnerText("span", ["Next"], "", "equal");
    await userClick(action.pid, "nextBtn", nextBtn);
    await sleep(4000);
    return;
  } else if (url.includes("signin/productaccess/landing")) {
    await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, url);
    // await userClick(action.pid, 'div[data-primary-action-label="Take steps"] button')
    return;
  } else if (url.includes("signin/challenge/selection")) {
    if (document.querySelector("[data-challengetype='51']")) {
      await userClick(action.pid, "[data-challengetype='51']");
      return;
    } else if (document.querySelector("[data-challengetype='17']")) {
      await userClick(action.pid, "[data-challengetype='17']");
      return;
    } else if (document.querySelector("[data-challengetype='9']")) {
      await userClick(action.pid, "[data-challengetype='9']");
      return;
    }
  } else if (url.includes("signin/challenge/recaptcha")) {
    /**
     * khu vực giải captcha
     */
    await sleep(15000);
    const maxAttempts = 21;
    /**
     * Sử dụng vòng lắp khi gải captcha không thành công
     */
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const div = document.querySelector("body > div:nth-child(5)");
      let nextBtn = getElementContainsInnerText("span", ["Next"], "", "equal");
      if (div?.style?.top === "-10000px") {
        if (nextBtn) {
          nextBtn = nextBtn.closest("button");
          await userClick(action.pid, "nextBtn", nextBtn);
          return;
        }
        await sleep(10000);
      } else {
        await sleep(5000);
        if (attempt == 2 || attempt == 4) {
          await userClick(action.pid, "nextBtn", nextBtn);
        }
      }
    }
    await sleep(10000);
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      "Không giải đươc captcha " + url
    );
    return;
  }

  // ver 2fa
  else if (url.includes("signin/rejected")) {
    if (action.client_config_run_check_2fa) {
      await userClick(
        action.pid,
        'a[href^="https://myaccount.google.com/signinoptions/two-step-verification"]'
      );
    } else {
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, url);
    }
    return;
  } else if (
    url.includes("signinoptions/two-step-verification/enroll-welcome")
  ) {
    if (!action.client_config_run_check_2fa) {
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, url);
    } else {
      await userClick(
        action.pid,
        'c-wiz[data-help-context="TWO_STEP_VERIFICATION_SCREEN"] button'
      );
      await sleep(3000);
      let confirmOKBtn = getElementContainsInnerText(
        "span",
        ["OK"],
        "",
        "equal"
      );
      if (confirmOKBtn) {
        await userClick(action.pid, "confirmOKBtn", confirmOKBtn);
      }
      return;
    }
  } else if (url.includes("challenge/iap/verify")) {
    // enter code
    const code = await _getPhoneCode(action);
    await userTypeEnter(action.pid, "#idvAnyPhonePin", code);
    await sleep(5000);
    return;
  } else if (url.includes("challenge/iap")) {
    // get phone
    let phone = await _getPhoneNumber(action);
    await userType(action.pid, 'input[type="tel"]', phone);

    let nextBtn = getElementContainsInnerText("span", ["Next"], "", "equal");
    await userClick(action.pid, "nextBtn", nextBtn);

    await sleep(5000);
    return;
  } else if (url.includes("signinoptions/two-step-verification/enroll")) {
    action.verify_2fa = true;
    // get phone
    let phone = await _getPhoneNumber(action);
    await userType(action.pid, 'input[type="tel"]', phone);

    let nextBtn = getElementContainsInnerText("span", ["Next"], "", "equal");
    await userClick(action.pid, "nextBtn", nextBtn);

    await sleep(5000);

    // enter code
    const code = await _getPhoneCode(action);
    await userTypeEnter(
      action.pid,
      'div[wizard-step-uid*="verifyIdvCode"] input',
      code
    );
    await sleep(5000);

    // turn on 2 fa
    let turnOnBtn = getElementContainsInnerText(
      "span",
      ["Turn on"],
      "",
      "equal"
    );
    await userClick(action.pid, "turnOnBtn", turnOnBtn);

    await updateProfileData({ pid: action.pid, recover_phone: phone });
    await sleep(30000);
    return;
  } else if (url.includes("signin/challenge/ipp/collect")) {
    // get phone
    let rePhone = action.re_phone;
    rePhone = rePhone.replace("+84", "0");
    action.entered_phone = false;
    await setActionData(action);
    let phone = await _getPhoneNumber(action, rePhone);
    await userTypeEnter(action.pid, "#phoneNumberId", phone);
    return;
  } else if (url.includes("signin/challenge/ipp/verify")) {
    // enter code
    const code = await _getPhoneCode(action);
    await userTypeEnter(action.pid, '[type="tel"]', code);
    return;
  } else if (url.includes("/challenge/ipp")) {
    let rePhone = action.re_phone;
    rePhone = rePhone.replace("+84", "0");
    action.entered_phone = false;
    await setActionData(action);
    let phone = await _getPhoneNumber(action, rePhone);
    await userTypeEnter(action.pid, "#phoneNumberId", phone);

    // enter code
    const code = await _getPhoneCode(action);
    await userTypeEnter(action.pid, '[type="tel"]', code);
    return;
  } else if (url.includes("/passkeyenrollment")) {
    let notNowBtn = getElementContainsInnerText(
      "span",
      ["Not now"],
      "",
      "equal"
    );
    await userClick(action.pid, "notNowBtn", notNowBtn);
    return;
  } else if (
    url.includes("https://mail.google.com/mail") &&
    action.verify_2fa
  ) {
    await goToLocation(
      action.pid,
      "https://myaccount.google.com/security?hl=en"
    );
    return;
  } else if (
    url.includes("https://myaccount.google.com/security") &&
    action.id !== "change_pass"
  ) {
    let veriBtn = document.querySelector(
      'a[href="signinoptions/two-step-verification"]'
    );
    if (veriBtn) {
      await userClick(action.pid, "veriBtn", veriBtn);
    } else {
      if (action.client_config_run_check_2fa) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "2FA_DONE"
        );
      }
    }
    return;
  } else if (url.includes("signinoptions/two-step-verification")) {
    await updateUserInput(action.pid, "ESC", 0, 0, 0, 0, "", "ESC");
    await updateUserInput(action.pid, "ESC", 0, 0, 0, 0, "", "ESC");
    await sleep(2000);
    let turnOffBtn = getElementContainsInnerText(
      "span",
      ["Turn off"],
      "",
      "equal"
    );
    await userClick(action.pid, "turnOffBtn", turnOffBtn);
    await updateUserInput(action.pid, "ESC", 0, 0, 0, 0, "", "ESC");
    await userClick(action.pid, "turnOffBtn", turnOffBtn);
    await sleep(3000);
    let btnOff = getElementContainsInnerText(
      "span",
      ["Turn off"],
      "",
      "equal",
      "array"
    ).pop();
    await userClick(action.pid, "btnOff", btnOff);
    return;
  }

  return true;
  //---- ver 2fa
}

async function _getPhoneCode(action) {
  let url = window.location.toString();
  // enter code
  let phoneRs = await getPhoneCode(action.order_id, action.api_name);
  if (phoneRs.error) {
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      "[getPhoneCode] " + phoneRs.error + url
    );
  } else {
    action.entered_code = true;
    await setActionData(action);
    let code = phoneRs.code + "";
    if (code.length == 5) {
      code = "0" + code;
    }

    return code;
  }
}

async function _getPhoneNumber(action, rePhone) {
  let url = window.location.toString();
  // get phone
  let phoneRs = await getPhone(rePhone);
  if (phoneRs.error) {
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      "[getPhone] " + phoneRs.error + url
    );
  } else {
    if (phoneRs.err) {
      phoneRs = await getPhone();
    }

    action.order_id = phoneRs.orderID;
    action.api_name = phoneRs.api_name;
    action.entered_phone = true;
    action.re_phone = phoneRs.phone;
    await setActionData(action);

    if (phoneRs.phone.startsWith("0")) {
      phoneRs.phone = phoneRs.phone.replace("0", "+84");
    } else if (!phoneRs.phone.startsWith("+84")) {
      phoneRs.phone = "+84" + phoneRs.phone;
    }

    return phoneRs.phone;
  }
}

async function verify_phone_number2(action) {
  if (!action.firstTabVerify) {
    action.firstTabVerify = true;
    await setActionData(action);
    await goToLocation(action.pid, "youtube.com/verify_phone_number");
  } else {
    closeUnactiveTabs();
  }

  try {
    if (document.querySelector("input")) {
      //enter phone number
      let phoneRs = await getPhone();
      if (phoneRs.error || action.entered_phone) {
        await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
      } else {
        if (phoneRs.err) {
          phoneRs = await getPhone();
        }

        action.order_id = phoneRs.orderID;
        action.api_name = phoneRs.api_name;
        action.entered_phone = true;
        await setActionData(action);

        // select vn
        await userClick(action.pid, "#input input");
        switch (phoneRs.country || action?.phone_country) {
          case "0":
            inputAction = "choose_russian";
            break;
          case "187":
            inputAction = "";
            break;
          case "10":
            inputAction = "choose_vietnam";
            break;
          case "16":
            inputAction = "choose_unitedkingdom";
            break;
          case "4":
            inputAction = "choose_philippines";
            break;
          case "7":
            inputAction = "choose_malaysia";
            break;
          case "63":
            inputAction = "choose_czechrepublic";
            break;
          case "31":
            inputAction = "choose_southafrica";
            break;
          case "11":
            inputAction = "choose_kyrgyzstan";
            break;
          case "40":
            inputAction = "choose_uzbekistan";
            break;
          case "6":
            inputAction = "choose_indonesia";
            break;
          case "36":
            inputAction = "choose_canada";
            break;
          case "52":
            inputAction = "choose_thailand";
            break;
          default:
            inputAction = `choose_${phoneRs.country || action?.phone_country}`;
            break;
        }

        if (inputAction) {
          await updateUserInput(
            action.pid,
            inputAction,
            0,
            0,
            0,
            0,
            "",
            inputAction
          );
        }
        await userType(action.pid, "input[required]", phoneRs.phone);
        await userClick(action.pid, "#send-code-button a");
        await sleep(4000);

        let phoneCodeInput = document.querySelector("#code-input input");

        if (!phoneCodeInput) {
          await sleep(4000);
          phoneCodeInput = document.querySelector("#code-input input");
        } else if (phoneCodeInput) {
          //enter code

          let phoneRs = await getPhoneCode(action.order_id, action.api_name);

          if (phoneRs.error || action.entered_code) {
            await reportScript(action);
          } else {
            action.entered_code = true;
            await setActionData(action);
            await userTypeEnter(action.pid, "#code-input input", phoneRs.code);
            await userClick(action.pid, "#submit-button");
            await updateProfileData({ pid: action.pid, verified: true });
            await sleep(5000);
            await updateActionStatus(
              action.pid,
              action.id,
              LOGIN_STATUS.SUCCESS
            );
          }
        } else {
          const errorMessage = document.querySelector(".error").textContent;
          await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
        }

        await sleep(30000);
      }
    } else {
      await updateProfileData({ pid: action.pid, verified: true });
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.SUCCESS);
    }
  } catch (e) {
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      "Loi verify sdt"
    );
  }
}
