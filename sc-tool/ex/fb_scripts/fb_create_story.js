async function fbCreateStory(action) {
  try {
    await sleep(5000);
    reportLive(action.pid);

    let url = window.location.toString();
    url = url.split("?")[0];

    await checkErrorFB(action);

    if (!action.selected_page && url.includes("facebook.com/pages")) {
      await selectFBPage(action, action.post_link);
    } else if (!action.selected_page) {
      await goToLocation(
        action.pid,
        "https://www.facebook.com/pages/?category=your_pages"
      );
    } else {
      await handleCreateStory(action);
    }
  } catch (er) {
    console.log("error", er);
    await reportScript(action, false);
  }
}

async function handleCreateStory(action) {
  await updateUserInput(action.pid, "ESC", 0, 0, 0, 0, "", "ESC");

  let createPostInput = getElementContainsInnerText(
    "span",
    ["What's on your mind?", "Bạn đang nghĩ gì", "bạn đang nghĩ gì thế"],
    "",
    "equal"
  );

  if (createPostInput) {
    if (createPostInput) {
      await userClick(action.pid, "createPostInput", createPostInput);

      let publicBtn = getElementContainsInnerText(
        "span",
        ["Anyone on or off Facebook"],
        "",
        "equal"
      );
      if (publicBtn) {
        await userClick(action.pid, "publicBtn", publicBtn);
        let doneBtn = getElementContainsInnerText(
          "span",
          ["Done"],
          "",
          "equal"
        );
        await userClick(action.pid, "doneBtn", doneBtn);
      }

      let textBox = document.querySelector(
        `[aria-label="What's on your mind?"]`
      );
      await userTypeEnter(action.pid, "textbox", action.content, textBox);

      /**
       * Đăng ảnh
       */
      const imageNameString = action.image_name || "";
      const imageNameArray = imageNameString.split(",");
      for (let i = 0; i < imageNameArray.length; i++) {
        const image_name = imageNameArray[i];
        await userPasteImage(action.pid, "textBox", textBox, null, image_name);
        await sleep(2000);
      }

      await sleep(2000);
      let postBtn =
        document.querySelector('div[aria-label="Đăng"]') ||
        document.querySelector('div[aria-label="Post"]') ||
        document.querySelector('div[aria-label="Next"]');
      await userClick(action.pid, "postBtn", postBtn);

      if (document.querySelector('div[aria-label="Post"]')) {
        await userClick(action.pid, 'div[aria-label="Post"]');
      }
      await sleep(7000);
      await checkErrorAfterRunScript(action);

      await reportScript(action);
    }
  }
}
