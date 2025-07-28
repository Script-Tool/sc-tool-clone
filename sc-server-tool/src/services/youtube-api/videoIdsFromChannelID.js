const axios = require("axios");
const MAX_RETRIES = 3; // Số lần gọi lại tối đa
const RETRY_DELAY = 1500; // Delay 3 giây (3000 mili giây)

async function getRandomAPIKey(apiKeyType) {
  // Logic lấy API key ngẫu nhiên từ database
  return await getModel("APIKey").getRandomKey(apiKeyType);
}

/**
 * lấy danh sách video ID thông qua channel id
 * @param {*} channelID
 * @param {*} maxVideo
 * @param {*} retries
 * @returns
 */
async function videoIdsFromChannelID(
  channelID = "",
  maxVideo = 3,
  retries = 0
) {
  if (!channelID) {
    return {};
  }

  try {
    const apiKey = await getRandomAPIKey("youtube_api");
    channelID = channelID.replace("channel/", "");
    const url = `https://www.googleapis.com/youtube/v3/search?type=video&part=snippet&channelId=${channelID}&maxResults=${
      maxVideo * 2
    }&key=${apiKey}`;
    const response = await makeAPICall(encodeURI(url), retries);
    return processVideoData(response.data, maxVideo);
  } catch (error) {
    return {};
  }
}

async function makeAPICall(url, retries) {
  try {
    const response = await axios.get(url);
    return response;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const retryDelay = RETRY_DELAY * (retries + 1); // Tăng thời gian delay sau mỗi lần gọi lại
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return makeAPICall(url, retries + 1);
    } else {
      console.error("Maximum number of retries reached");
      return {};
    }
  }
}

function processVideoData(data, maxVideo) {
  if (data.error) {
    return { error: data.error };
  }

  const { items } = data;
  const videoIds = [];
  let channelTitle = "";

  for (const item of items) {
    if (videoIds.length >= maxVideo) {
      break;
    }

    const { kind, videoId } = item.id;
    const { channelTitle: itemChannelTitle } = item.snippet;

    if (kind === "youtube#video" && videoId) {
      if (!channelTitle) {
        channelTitle = itemChannelTitle;
      }
      videoIds.push(videoId);
    }
  }

  return { channelTitle, videoIds };
}

module.exports = {
  getRandomAPIKey,
  videoIdsFromChannelID,
};
