async function khangKenhYoutube(action) {
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

      await enterMail();

      await sleep(180000);
    } else if (url.indexOf("myaccount.google.com") > -1) {
      await goToLocation(
        action.pid,
        "https://www.youtube.com/channel_switcher?next=%2Faccount&feature=settings"
      );
    } else if (url.indexOf("youtube.com/account") > -1) {
      reportLive(action.pid);
      closeUnactiveTabs();

      if (action?.first_load) {
        await handleUsersBlockSelection(action);
      } else {
        action.first_load = true;
        await setActionData(action);
        await updateUserInput(action.pid, "NEW_TAB", 0, 0, 0, 0, "", "New TAB");
        await goToLocation(
          action.pid,
          "https://www.youtube.com/channel_switcher?next=%2Faccount&feature=settings"
        );
      }

      return;
    } else if (url.indexOf("youtube.com/channel-appeal?authuser=0") > -1) {
      try {
        await userClick(action.pid, "#review-button");
        await sleep(3000);
        await userClick(action.pid, "#nextButton");
        await sleep(3000);
        await userClick(action.pid, "#start-appeal-button");
        await sleep(3000);
        const allTextArea = document.querySelectorAll("textarea");
        await userTypeEnter(
          action.pid,
          "textarea",
          action.khanh_kenh_account_noi_dung,
          allTextArea[1]
        );
        await sleep(3000);
        await userClick(action.pid, "#submitButtonOnFeedback2");
        await sleep(3000);
        if (url.indexOf("authuser=0&entry=account_switcher") > -1) {
          await goToLocation(
            action.pid,
            "https://www.youtube.com/channel_switcher?next=%2Faccount&feature=settings"
          );
        } else {
          await updateActionStatus(
            action.pid,
            action.id,
            LOGIN_STATUS.ERROR,
            "Co 1 kenh dang cho xet duyet khang cao"
          );
          return;
        }
      } catch (error) {
        await updateActionStatus(
          action.pid,
          action.id,
          LOGIN_STATUS.ERROR,
          "Khang cao thanh cong"
        );
        return;
      }
    } else {
      await updateActionStatus(action.pid, action.id, LOGIN_STATUS.ERROR, url);
    }
  } catch (error) {
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      error?.toString()
    );
  }
}

async function handleUsersBlockSelection(action) {
  await sleep(4000);
  let channels = document.querySelectorAll(
    'ytd-account-item-renderer[class="style-scope ytd-channel-switcher-page-renderer"]'
  );

  if (!channels.length) {
    channels = document.querySelectorAll(
      'ytd-account-item-renderer[class="style-scope ytd-channel-switcher-page-renderer"]'
    );
    await sleep(4000);
  }
  await setActionData(action);

  let filteredChannels = [];
  // Lặp qua danh sách các phần tử đã chọn
  channels.forEach((element) => {
    // Kiểm tra va lay nhung kenh bi khoa
    const children = element.children[0].children[3];
    if (children && !children.hasAttribute("hidden")) {
      filteredChannels.push(element);
    }
  });

  if (filteredChannels.length && !action.checkKenhBiKhoa) {
    action.checkKenhBiKhoa = true;
    action.soKenhBiKhoa = filteredChannels.length;
    await setActionData(action);
    updateTotalCreatedUsers(
      action.pid,
      channels.length,
      filteredChannels.length
    );
  }

  let channel = filteredChannels[0];
  await sleep(5000);
  if (channel) {
    await setActionData(action);
    await userClick(action.pid, "", channel);
  } else {
    await updateActionStatus(
      action.pid,
      action.id,
      LOGIN_STATUS.ERROR,
      "Khang cao thanh cong :" + action.soKenhBiKhoa
    );
    return;
  }
}
