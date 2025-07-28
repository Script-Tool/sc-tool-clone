const axios = require("axios");

const MAX_RETRIES = 3; // Số lần gọi lại tối đa
const RETRY_DELAY = 1500; // Delay 3 giây (3000 mili giây)

async function getChannelInfo(channelId = "", retries = 0) {
  const APIKeyModel = getModel("APIKey");
  const API_KEY = await APIKeyModel.getRandomKey("youtube_api");
  try {
    channelId = channelId.replace("channel/", "").replace("/", "");

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          key: API_KEY,
          id: channelId,
          part: "snippet,statistics",
        },
      }
    );

    const { items } = response.data;
    if (items && items.length > 0) {
      return extractChannelInfo(items[0]);
    } else {
      return { error: true };
    }
  } catch (error) {
    if (error.response) {
      // Lỗi từ phía server
      const statusCode = error.response.status;
      const errorMessage = error.response.data.error.message;

      if (statusCode === 403 && errorMessage.includes("quota")) {
        console.error("API key reached quota limit");
      } else if (
        (statusCode === 403 && errorMessage.includes("disabled")) ||
        error.response.statusText.includes("Forbidden")
      ) {
        console.error("API key is disabled", API_KEY);
        await APIKeyModel.deleteOne({ key: API_KEY });
      } else if (statusCode == 400) {
        await APIKeyModel.deleteOne({ key: API_KEY });
      } else {
        console.error("Error fetching channel information:", errorMessage);

        const apiKey = extractAPIKey(errorMessage) || "";
        if (apiKey) await APIKeyModel.deleteOne({ key: apiKey });
      }
    } else if (error.request) {
      // Không nhận được phản hồi từ server
      console.error("No response received from server");
    } else {
      // Lỗi khác
      console.error("Error:", error.message);
    }

    if (retries < MAX_RETRIES) {
      // Gọi lại hàm sau RETRY_DELAY mili giây
      setTimeout(() => {
        getChannelInfo(channelId, retries + 1);
      }, RETRY_DELAY);
    } else {
      console.log("Maximum number of retries reached");
      return { error: true };
    }
  }
}

function extractChannelInfo(channelData) {
  const { snippet, statistics } = channelData;
  return {
    title: snippet.title,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.default.url,
    subscriberCount: parseInt(statistics.subscriberCount),
    videoCount: parseInt(statistics.videoCount),
    viewCount: parseInt(statistics.viewCount),
    channel_user_name: snippet.customUrl,
  };
}

// Tách lấy key từ thông báo
function extractAPIKey(errorMessage) {
  const regex = /api_key:([a-zA-Z0-9_-]+)/;
  const match = errorMessage.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}

module.exports = { getChannelInfo };
