async function fbCommentGroup(action) {
  try {
    await sleep(5000);
    reportLive(action.pid);

    let url = window.location.toString();
    url = url.split("?")[0];

    await checkErrorFB(action);

    if (!action.selected_page && url.includes("facebook.com/pages")) {
      await selectFBPage(action, action.group_link);
    } else if (!action.selected_page) {
      await goToLocation(
        action.pid,
        "https://www.facebook.com/pages/?category=your_pages"
      );
    } else if (
      action.after_selected_page &&
      url.includes("https://www.facebook.com/profile")
    ) {
      action.after_selected_page = false;
      await setActionData(action);
      await goToLocation(action.pid, action.group_link);
    } else {
      await updateUserInput(action.pid, "ESC", 0, 0, 0, 0, "", "ESC");

      let random_post = action.random_post || 5;

      let textboxAll = document.querySelectorAll('div[role="textbox"]');

      while (textboxAll.length < random_post) {
        const currentLenth = textboxAll.length;
        await userScroll(action.pid, 50);
        textboxAll = document.querySelectorAll('div[role="textbox"]');
        if (textboxAll.length <= currentLenth) {
          break;
        }
      }

      let textbox = textboxAll[randomRanger(0, random_post)];

      if (textbox && action.comment) {
        await userClick(action.pid, "textbox", textbox);
        await sleep(2000);
        // textbox = document.querySelector('div[role="textbox"]')

        /**
         * Đăng ảnh
         */
        const imageNameString = action.image_name || "";
        const imageNameArray = imageNameString.split(",");
        for (let i = 0; i < imageNameArray.length; i++) {
          const image_name = imageNameArray[i];
          await userPasteImage(
            action.pid,
            "textbox",
            textbox,
            null,
            image_name
          );
          await sleep(2000);
        }

        await userOnlyTypeEnter(
          action.pid,
          "textbox",
          action.comment || "",
          textbox
        );

        let likeData = document.querySelector(
          'div>div>span>div>span[dir="auto"]'
        );
        if (likeData) {
          let data_reported = likeData.innerText;
          action.data_reported = data_reported;
        }

        await sleep(15000);
        await checkErrorAfterRunScript(action);
      } else {
        console.log("NOT found text box or comment");
      }

      await reportScript(action);
    }
  } catch (er) {
    console.log("err", er);
    await reportScript(action, false);
  }
}
