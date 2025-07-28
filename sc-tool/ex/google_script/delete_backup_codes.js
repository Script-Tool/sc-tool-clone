async function deleteBackupCodes(action) {
  const url = window.location.toString();

  try {
    switch (true) {
      case url.includes(action.directLink): {
        await goToLocation(
          action.pid,
          "https://myaccount.google.com/two-step-verification/backup-codes"
        );
        break;
      }

      case url.includes(
        "https://myaccount.google.com/two-step-verification/backup-codes"
      ): {
        await sleep(2000);
        await userClick(action.pid, '[aria-label="Delete backup codes"]');

        await sleep(2000);
        await userClick(action.pid, '[data-mdc-dialog-action="ok"]');
        await sleep(2000);

        await updateProfileData({
          pid: action.pid,
          backup_code: "",
        });
        await reportScript(action);
        break;
      }

      case url.includes("accounts.google.com/v3/signin/challenge/pwd"): {
        await waitForSelector("input[name='Passwd']");
        await userTypeEnter(
          action.pid,
          "input[name='Passwd']",
          action.password
        );
        await sleep(2000);
        break;
      }

      case url.indexOf("https://accounts.google.com/v3/signin/challenge/bc") >
        -1: {
        await waitForSelector('input[type="tel"]');
        await userTypeEnter(
          action.pid,
          'input[type="tel"]',
          action?.backupCode
        );
        break;
      }

      case url.indexOf("accounts.google.com/signin/selectchallenge") > -1 ||
        url.indexOf(
          "https://accounts.google.com/signin/v2/challenge/selection"
        ) > -1 ||
        url.indexOf(
          "https://accounts.google.com/v3/signin/challenge/selection"
        ) > -1: {
        if (!action?.twoFA && action?.backupCode) {
          if (document.querySelectorAll('[data-action="selectchallenge"]')[1]) {
            await userClick(
              action.pid,
              '[data-action="selectchallenge"]',
              document.querySelectorAll('[data-action="selectchallenge"]')[1]
            );
            break;
          }
        }
        break;
      }

      case url.includes("signin/challenge/totp"): {
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
        break;
      }

      default:
        action.data_reported = "Lỗi: " + url;
        await reportScript(action, false);
        break;
    }
  } catch (error) {
    action.data_reported = "Lỗi: " + url + error;
    await reportScript(action, false);
  }
}
