const { default: axios } = require("axios");
const { sleep } = require("../../utils/utils");

// Lấy số liệu của kênh
const getChannelDetails = async (channelId, maxRetries = 5) => {
  let attempt = 0;
  const APIKey = getModel("APIKey");

  while (attempt < maxRetries) {
    try {
      const youtubeApiKey = await APIKey.getRandomKey("youtube_api");
      const { data } = await axios.get(
        `https://www.googleapis.com/youtube/v3/channels`,
        {
          params: {
            part: "snippet,contentDetails,statistics,brandingSettings",
            id: channelId,
            key: youtubeApiKey,
          },
        }
      );

      if (data.items.length === 0) {
        console.log(`❌ Không tìm thấy kênh`);
        return;
      }

      return data.items[0];
    } catch (error) {
      attempt++;
      const errorKey = error.config.params.key;
      console.log("🚀 ~ getChannelDetails ~ error:", errorKey);

      // sua lai khi api key loi
      await APIKey.deleteOne({
        key: errorKey,
        type: "youtube_api",
      });
      if (attempt >= maxRetries) {
        throw new Error(
          "Max retries reached. Unable to fetch channel details."
        );
      }
      await sleep(3000);
    }
  }
};

// Lấy thông tin chi tiết của video
const getVideoDetails = async (videoIds) => {
  try {
    const APIKey = getModel("APIKey");
    const youtubeApiKey = await APIKey.getRandomKey("youtube_api");
    const { data } = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: "snippet,contentDetails,statistics",
          id: videoIds,
          key: youtubeApiKey,
        },
      }
    );

    return data.items;
  } catch (error) {
    console.log("🚀 ~ getVideoDetails ~ error:", error);
  }
};

// Lấy danh sách video của kênh
const getVideoList = async (channelId, { maxResults = 5 }) => {
  try {
    const APIKey = getModel("APIKey");
    const youtubeApiKey = await APIKey.getRandomKey("youtube_api");
    const { data } = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          part: "snippet,contentDetails,statistics",
          channelId,
          maxResults,
          order: "date",
          type: "video",
          key: youtubeApiKey,
        },
      }
    );

    return data.items;
  } catch (error) {
    console.log("🚀 ~ getVideoList ~ error:", error);
  }
};

const parseDuration = (isoDuration) => {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  return `${hours > 0 ? hours + ":" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
};

function getYouTubeChannelId(url) {
  const parts = new URL(url).pathname.split("/channel/");
  return parts.length > 1 ? parts[1] : null;
}

const youtubeAPI = {
  getChannelDetails,
  getVideoDetails,
  getVideoList,
  parseDuration,
  getYouTubeChannelId,
};

module.exports = youtubeAPI;
