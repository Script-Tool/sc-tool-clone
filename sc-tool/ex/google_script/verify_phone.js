async function verifyPhone() {
  const url = window.location.toString();

  try {
    if (url.includes(action.directLink)) {
      await goToLocation(action.pid, "youtube.com/verify_phone_number");
    } else if (url == "https://www.youtube.com/") {
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
    } else if (url.indexOf("youtube.com/verify_phone_number") > -1) {
      await verifyPhoneNumber(action);
    } else if (url.indexOf("https://www.youtube.com/channel" > -1)) {
      await reportScript(action);
    } else {
      action.data_reported = "Lỗi: " + url;
      await reportScript(action, false);
      return;
    }
  } catch (error) {
    action.data_reported = "Lỗi: " + url;
    await reportScript(action, false);
  }
}

async function verifyPhoneNumber(action) {
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
        await reportScript(action);
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
            return reportScript(action);
          }
        } else {
          const errorMessage = document.querySelector(".error").textContent;
          action.data_reported = errorMessage;
          return reportScript(action, false);
        }

        await sleep(30000);
      }
    } else {
      await updateProfileData({ pid: action.pid, verified: true });
      return reportScript(action);
    }
  } catch (e) {
    action.data_reported = "Lỗi: " + e;
    await reportScript(action, false);
  }
}
