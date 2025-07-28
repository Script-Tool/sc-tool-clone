const axios = require("axios");
const extractUsernameOrChannelId = require("../../utils/extractUsernameOrChannelId");

/* Chức năng: call api của youtube để lấy ra dữ liệu với tên của channel tương ứng
 * Tham số truyền vào: channelName là tên của channel
 */

async function getChannelID(url) {
  const username = extractUsernameOrChannelId(url);
  try {
    if (username) {
      let i = 0;
      let forUsername = username;
      do {
        let APIKEY = getModel("APIKey");
        const papidapiKey =
          (await APIKEY.getRandomKey("rapidapi")) ||
          "701034935dmshefcb89a6a01c8d0p1de1d2jsn4273dab997f9";
        const options = {
          method: "GET",
          url: "https://yt-api.p.rapidapi.com/channel/search",
          params: {
            query: "cat",
            forUsername,
          },
          headers: {
            "X-RapidAPI-Key": papidapiKey,
            "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
          },
        };
        let response = await axios.request(options).catch((err) => {
          if (
            err.response.status == 400 ||
            err.response.status == 403 ||
            err.response.status == 429
          ) {
            i++;
            delay(3000);
          }
        });
        if (response && response?.data && response.status == 200) {
          if (response.data.error) {
            if (response.data.code == 403) {
              if (forUsername.includes("@")) {
                forUsername = forUsername.replace("@", "");
              } else {
                forUsername = "@" + forUsername;
              }
            }
            i++;
          } else {
            i = 4;
            let channelId = response.data.meta.channelId;
            return channelId;
          }
        }
      } while (i < 3);
    } else {
      console.log("error getChannelID");
    }
  } catch (error) {
    console.log("error getChannelID");
    return "";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = getChannelID;
