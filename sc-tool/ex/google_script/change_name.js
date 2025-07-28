// Đổi tên google
async function changeName(action) {
  try {
    let url = window.location.toString();
    if (url.includes(action.directLink)) {
      await goToLocation(
        action.pid,
        "https://myaccount.google.com/profile/name/edit"
      );
    }

    // Lỗi tài khoản
    if (url.indexOf("support.google.com/accounts/answer/40039") > -1) {
      await updateActionStatus(
        action.pid,
        "login",
        LOGIN_STATUS.ERROR,
        "support.google.com/accounts/answer/40039"
      );
      return;
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

    if (url.includes("accounts.google.com/v3/signin/challenge/dp")) {
      await updateActionStatus(
        action.pid,
        "login",
        0,
        "accounts.google.com/v3/signin/challenge/dp -- Xác minh danh tính của bạn"
      );
      return;
    }

    // Lấy tên ngẫu nhiên
    if (url.includes("myaccount.google.com/profile/name/edit")) {
      let fullName = randomFullNameLocal();
      const names = fullName.split(" ");
      const lastName = names[names.length - 1];
      const firstName = names.slice(0, names.length - 1).join(" ");
      const inputList = document.querySelectorAll("input.VfPpkd-fmcmS-wGMbrd");

      await userTypeEnter(action.pid, "", lastName, inputList[0]);
      await userTypeEnter(action.pid, "", firstName, inputList[1]);
      await userClick(action.pid, "button.UywwFc-LgbsSe");

      await sleep(5000);
      await updateActionStatus(
        action.pid,
        action.id,
        0,
        `Đã đổi thành tên : ${fullName}`
      );
    }
  } catch (error) {
    await updateActionStatus(
      action.pid,
      action.id,
      0,
      `[catch]: ${error.toString()}`
    );
  }
}
