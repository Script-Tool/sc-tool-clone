async function fbAddFriend(action) {
  try {
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
    } else if (url.includes("/members")) {
      const count = action.count || 10;
      let allAddMemberBtn = document.querySelectorAll(
        'div[aria-label="Add friend"]'
      );

      while (allAddMemberBtn.length < count) {
        const currentLenth = allAddMemberBtn.length;
        await userScroll(action.pid, 50);
        allAddMemberBtn = document.querySelectorAll(
          'div[aria-label="Add friend"]'
        );
        if (allAddMemberBtn.length <= currentLenth) {
          break;
        }
      }


      for (let index = 0; index < allAddMemberBtn.length; index++) {
        const element = allAddMemberBtn[index];
        await userClick(action.pid, "element", element);
      }

      await checkErrorAfterRunScript(action);
      await reportScript(action);
    } else if (url.includes("profile.php")) {
      if (document.querySelector('div[aria-label="Add friend"]')) {
        await userClick(action.pid, 'div[aria-label="Add friend"]');
        await sleep(3000);
        await reportScript(action);
      }
    } else {
      if (document.querySelector('div[aria-label="Add friend"]')) {
        await userClick(action.pid, 'div[aria-label="Add friend"]');
        await sleep(3000);
        await reportScript(action);
      } else {
        await reportScript(action, false);
      }
    }
  } catch (er) {
    console.log(er);
    await reportScript(action, false);
  }
}
