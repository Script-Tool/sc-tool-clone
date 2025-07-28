async function channelAppeal(action) {
  let url = window.location.toString();

  try {
    if (url.includes(action.directLink)) {
      await goToLocation(action.pid, "mail.google.com/mail/u/0 ");
      return;
    } else if (
      url.includes("accounts.google.com/v3/signin/identifier") ||
      url.indexOf("https://accounts.google.com/signin/v2/identifier") > -1 ||
      url.includes("gmail/about") ||
      url.includes("accounts.google.com/v3/signin/productaccess/landing")
    ) {
      await updateActionStatus(
        action.pid,
        "login",
        LOGIN_STATUS.ERROR,
        `[error] ${url}`
      );
      return;
    }
    //   Tìm kiếm
    else if (url.includes("mail.google.com/mail/u/0/")) {
      await sleep(15000);

      // Nếu có Allow smart features in Gmail, Chat, and Meet to use your data
      if (document.querySelector('button[name="data_consent_dialog_next"]')) {
        let radiobtn = document.evaluate(
          '//div[contains(text(), "Turn off smart features")]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (radiobtn) await userClick(action.pid, "radiobtn", radiobtn);

        await userClick(action.pid, 'button[name="data_consent_dialog_next"]');

        if (document.querySelector('button[name="turn_off_in_product"]'))
          await userClick(action.pid, 'button[name="turn_off_in_product"]');

        let radiobtn2 = document.evaluate(
          '//div[contains(text(), "Personalize other Google products with my Gmail, Chat, and Meet data")]',
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
        if (radiobtn2) await userClick(action.pid, "radiobtn2", radiobtn2);

        if (document.querySelector('button[name="data_consent_dialog_done"]'))
          await userClick(
            action.pid,
            'button[name="data_consent_dialog_done"]'
          );

        await updateUserInput(
          action.pid,
          "RELOAD_PAGE",
          0,
          0,
          0,
          0,
          "",
          "RELOAD_PAGE"
        );
        return;
      }
      // Tìm mail
      await userTypeEnter(action.pid, 'input[name="q"]', "subject:Youtube ");
      await sleep(20000);
      action.dataChanle = [];
      // danh sách kênh có kênh bị khóa
      let allEmailYoutube =
        document
          .querySelector("div.ae4.UI.aZ6.id")
          ?.querySelectorAll("table tr") || [];
      let mailNumber = allEmailYoutube?.length || 0;

      if (mailNumber == 0) {
        await updateActionStatus(
          action.pid,
          action.id,
          0,
          "Không tìm thấy email nào liên quan đến kênh bị khoá"
        );
      }

      for (let index = 0; index < mailNumber; index++) {
        // if (action.dataChanle.length == 3) break;
        await sleep(1000);
        let emailElement = allEmailYoutube[index];
        if (emailElement) {
          // click vào mail
          await userClick(action.pid, "emailElement", emailElement);
          await sleep(1000);
          // Lấy tên và các thông tin khách
          const channelUrl = (
            document
              .querySelector('ul[style*="direction:ltr"]')
              ?.querySelectorAll("a")?.[2]?.textContent || ""
          )
            ?.trim()
            ?.replace(/\s+/g, "");

          const channelName = (
            document.querySelector("h2.hP")?.textContent || ""
          )
            ?.split(",")?.[0]
            ?.trim();

          const resolutionOption = document
            .querySelector('ul[style*="direction:ltr"]')
            ?.querySelectorAll("a")?.[3]?.textContent;

          const data = { channelName, channelUrl };

          if (resolutionOption) {
            const hrefValue = document
              .querySelector('ul[style*="direction:ltr"]')
              ?.querySelectorAll("a")[1]
              ?.getAttribute("href");
            data.linkAppeal = hrefValue;
          }

          if (channelName && channelUrl) action.dataChanle.push(data);

          await updateUserInput(
            action.pid,
            "BROWSER_GO_BACK",
            0,
            0,
            0,
            0,
            "",
            "BROWSER_GO_BACK"
          );
        }
      }
      if (action?.dataChanle?.length == 0) {
        await updateActionStatus(
          action.pid,
          action.id,
          0,
          "Không tìm thấy email nào liên quan đến kênh bị khoá"
        );
      }
      action.numberChanneel = action.dataChanle.length;
      await setActionData(action);
      await goToLocation(
        action.pid,
        "https://support.google.com/accounts/contact/suspended?p=youtube&visit_id=638504893154674130-221723390&rd=1"
      );
      return;
    } else if (url.includes("support.google.com/accounts/contact/suspended")) {
      // Nhập thông tin kháng cáo

      // Kháng cáo xong
      if (action?.dataChanle?.length == 0) {
        // Kháng cáo xong
        await updateActionStatus(
          action.pid,
          action.id,
          0,
          `Đã kháng cáo toàn bộ kênh ${action.numberChanneel}`
        );
      }
      // Nhập nội dung kháng cáo, lấy thông tin và gửi kháng kênh
      const channelInfo = action.dataChanle[0];
      if (channelInfo.linkAppeal) {
        await goToLocation(action.pid, channelInfo.linkAppeal);
        return;
      }
      if (channelInfo) {
        await userType(action.pid, "#full_name", channelInfo?.channelName);
        const email = document.querySelector("#Username_youtube")?.value || "";
        await userType(action.pid, "#email_prefill_req", email);
        await userType(action.pid, "#url_youtube", channelInfo?.channelUrl);
        await userType(
          action.pid,
          "#suspended_reason_youtube",
          action?.channel_appeal_content ||
            "My account does not violate any of your policies, this is a mistake by your automatic violation checking system, please check again and unlock my account soon. Firstly, I can sue you if this account is not restored, it contains a lot of valuable data and information."
        );

        action?.dataChanle?.shift();
      }

      setActionData(action);
      // chờ gải captcha
      await userClick(action.pid, ".submit-button");
      // document.querySelector('body > div:nth-child(91)')
      await sleep(3000);

      for (let index = 0; index < 5; index++) {
        let confirmationMessage = document.querySelector(
          "div.confirmation-message"
        );
        if (confirmationMessage?.classList?.contains("hidden")) {
          await sleep(40000);
          await userClick(action.pid, ".submit-button");
        } else {
          await updateUserInput(
            action.pid,
            "RELOAD_PAGE",
            0,
            0,
            0,
            0,
            "",
            "RELOAD_PAGE"
          );
          break;
        }
      }
    } else if (url.includes("channel-appeal")) {
    

      if (document.querySelector("div.label.style-scope.ytcp-button")) {
        await userClick(action.pid, "div.label.style-scope.ytcp-button");
      }

      if (document.querySelectorAll("ytcp-button#nextButton")) {
        await userClick(action.pid, "ytcp-button#nextButton");
      }
      if (document.querySelectorAll("ytcp-button#start-appeal-button")) {
        await userClick(action.pid, "ytcp-button#start-appeal-button");
      }

      if (document.querySelectorAll("ytcp-button#start-appeal-button")) {
        await userClick(action.pid, "ytcp-button#start-appeal-button");
      }

      await userType(
        action.pid,
        "textarea",
        action?.channel_appeal_content ||
          "My account does not violate any of your policies, this is a mistake by your automatic violation checking system, please check again and unlock my account soon. Firstly, I can sue you if this account is not restored, it contains a lot of valuable data and information."
      );
      if (document.querySelectorAll("ytcp-button#submitButtonOnFeedback2")) {
        await userClick(action.pid, "ytcp-button#submitButtonOnFeedback2");

        action?.dataChanle?.shift();

        setActionData(action);
        await goToLocation(
          action.pid,
          "https://support.google.com/accounts/contact/suspended?p=youtube&visit_id=638504893154674130-221723390&rd=1"
        );
        return;
      } else {
        if (document.querySelectorAll("h2#title")) {
          action?.dataChanle?.shift();
          setActionData(action);
        }
        await goToLocation(
          action.pid,
          "https://support.google.com/accounts/contact/suspended?p=youtube&visit_id=638504893154674130-221723390&rd=1"
        );
        return;
      }

    } else {
      await updateActionStatus(
        action.pid,
        action.id,
        0,
        `[else] ${error.toString()}`
      );
    }
  } catch (error) {
    await updateActionStatus(
      action.pid,
      action.id,
      0,
      `[catch] ${error.toString()}`
    );
  }
}
