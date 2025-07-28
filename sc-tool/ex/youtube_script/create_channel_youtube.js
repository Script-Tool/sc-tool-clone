async function createChannelYoutube(action) {
  const url = window.location.toString();

  try {
    if (url.includes(action.directLink)) {
      await goToLocation(action.pid, "youtube.com/create_channel");
      return;
    }

    if (url === "https://www.youtube.com/") {
      await sleep(5000);

      const checkCreateChannel =
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
        await sleep(6000);
      }
      return;
    }

    if (url.includes("youtube.com/channel")) {
      await updateProfileData({
        pid: action.pid,
        channel_link: url,
      });
      await goToLocation(
        action.pid,
        "youtube.com/channel_switcher?next=%2Faccount&feature=settings"
      );
      return;
    }

    if (url.includes("youtube.com/account")) {
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

      await updateProfileData({
        pid: action.pid,
        total_created_users: channels.length,
      });

      await reportScript(action);
      return;
    }

    // Nếu không match bất kỳ URL nào
    action.data_reported = "Lỗi: " + url;
    await reportScript(action, false);
  } catch (error) {
    action.data_reported = "Lỗi: " + url;
    await reportScript(action, false);
  }
}
