async function createYoutubeKey(action) {
  try {
    let url = window.location.toString();

    if (url.includes("accounts.google.com/v3/signin/identifier")) {
      await updateActionStatus(
        action.pid,
        "login",
        LOGIN_STATUS.ERROR,
        "accounts.google.com/v3/signin/identifier"
      );
      return;
    }

    // bước đồng ý điều khoản
    if (
      url.includes("console.cloud.google.com/projectselector2/apis/credentials")
    ) {
      await sleep(3000);
      const checkbox0 = document.querySelector("#mat-mdc-checkbox-0-input");
      // const checkbox1 = document.querySelector("#mat-mdc-checkbox-1-input");
      // const checkbox2 = document.querySelector("#mat-mdc-checkbox-2-input");
      if (checkbox0) {
        await userClick(action.pid, "", checkbox0);
        // await userClick(action.pid, "", checkbox2);
        const agreeAndContinue = document.querySelector(
          ".mat-mdc-dialog-legacy-line-height"
        );
        await userClick(action.pid, "", agreeAndContinue);
      }

      // di chuyển đến project hoặc tạo project mới
      const projectsContainer = document.querySelectorAll(
        ".cfc-resource-card-header-title"
      );
      if (projectsContainer[0]) {
        await userClick(action.pid, "", projectsContainer[0]);
      } else {
        const createProject = document.querySelector(
          "button.projectselector-project-create .mdc-button__label"
        );
        await userClick(action.pid, "", createProject);
      }
    }

    // Bước tạo mới project
    if (url.includes("console.cloud.google.com/projectcreate")) {
      await sleep(5000);
      const createBtn = document.querySelector('button[type="submit"]');
      if (createBtn) {
        await userClick(action.pid, "", createBtn);
        await userClick(action.pid, "", createBtn);
      }
    }

    // click đến "Credentials" nếu đang ở dashboadrd
    if (url.includes("console.cloud.google.com/apis/dashboard")) {
      await sleep(3000);
      const listBtn = document.querySelectorAll("span.cfc-page-displayName");
      await userClick(action.pid, "", listBtn[2]);
    }

    if (url.includes("console.cloud.google.com/apis/credentials")) {
      await sleep(3000);
      const createCredential = document.querySelector(
        'button[aria-label="Create credential"]'
      );
      await userClick(action.pid, "", createCredential);

      let btnApiKey = document.querySelector("div.cfc-menu-item-col");
      if (!btnApiKey) {
        await userClick(action.pid, "", createCredential);
        btnApiKey = document.querySelector("div.cfc-menu-item-col");
      }

      await userClick(action.pid, "", btnApiKey);
      await sleep(15000);

      // Giá trị cần lấy trả lại server
      action.youtube_key = document.querySelector(
        "input.cfc-code-snippet-input"
      ).value;

      await setActionData(action);
      await goToLocation(
        action.pid,
        "console.cloud.google.com/apis/library/youtube.googleapis.com"
      );
    }

    if (
      url.includes(
        "console.cloud.google.com/apis/library/youtube.googleapis.com"
      )
    ) {
      await sleep(4000);
      let retryCount = 0;
      const maxRetries = 2; // Số lần lặp lại tối đa

      while (retryCount < maxRetries) {
        const enable = document.querySelectorAll(
          'button[aria-label="enable this API"]'
        );
        const managetn = document.querySelectorAll(
          'button[aria-label="manage this API"]'
        );

        if (enable[1]) {
          await userClick(action.pid, "", enable[1]);
          break; // Thoát khỏi vòng lặp nếu đã xử lý thành công
        } else if (managetn[1] && action.youtube_key) {
          await updateProfileData({
            pid: action.pid,
            youtube_key: action.youtube_key,
          });
          await addKey({
            pid: action.pid,
            apiKey: action.youtube_key,
            type: "youtube_api",
          });
          await updateActionStatus(
            action.pid,
            action.id,
            0,
            "đã lấy được youtube api key"
          );
          break; // Thoát khỏi vòng lặp nếu đã xử lý thành công
        } else {
          retryCount++; // Tăng số lần lặp lại
          await sleep(4000); // Chờ thêm 4 giây trước khi lặp lại
        }
      }
    }

    if (
      url.includes(
        "console.cloud.google.com/apis/api/youtube.googleapis.com/metrics"
      )
    ) {
      if (action.youtube_key) {
        await addKey({
          pid: action.pid,
          apiKey: action.youtube_key,
          type: "youtube_api",
        });
        await updateActionStatus(
          action.pid,
          action.id,
          0,
          "đã lấy được youtube api key"
        );
      }
    }
  } catch (error) {}
}
