const axios = require("axios");
const MAX_RETRIES = 3; // Số lần gọi lại tối đa
const RETRY_DELAY = 1500; // Delay 3 giây (3000 mili giây)

async function getRandomAPIKey(apiKeyType) {
  // Logic lấy API key ngẫu nhiên từ database
  return await getModel("APIKey").getRandomKey(apiKeyType);
}

/**
 * lấy danh sách tên video thông qua channel id
 * @param {*} channelID 
 * @param {*} maxVideo 
 * @param {*} retries 
 * @returns 
 */
async function videoNamesFromChannelID(
  channelID = "",
  maxVideo = 10,
  retries = 0
) {
  if (!channelID) {
    console.log("Không có channel id");
    return {};
  }

  try {
    const apiKey = await getRandomAPIKey("youtube_api");

    channelID = channelID.replace("channel/", "");
    const url = `https://www.googleapis.com/youtube/v3/search?type=video&part=snippet&channelId=${channelID}&maxResults=${maxVideo}&key=${apiKey}`;

    const response = await makeAPICall(encodeURI(url), retries);
    return processVideoData(response?.data, maxVideo);
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
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return makeAPICall(url, retries + 1);
    } else {
      console.error("Maximum number of retries reached");
      return {};
    }
  }
}

function processVideoData(data, maxVideo) {
  if (data?.error) {
    return { error: data?.error };
  }

  const { items } = data;
  const names = [];
  let channelTitle = "";

  for (const item of items) {
    if (names.length >= maxVideo) {
      break;
    }
    const { kind, videoId } = item.id;
    let { title, channelTitle: itemChannelTitle, description } = item.snippet;
    
    // Loại bỏ ký tự đặc biệt, xuống dòng và thay bằng dấu cách
    title = title.replace(/(&amp;|&quot;|\\n|\\r|\n|\r|#|&|"|\\)/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Chỉ lấy 50 ký tự đầu của mô tả
    const shortDescription = description ? description.substring(0, 100).replace(/(&amp;|&quot;|\\n|\\r|\n|\r|#|&|"|\\)/g, ' ').replace(/\s+/g, ' ').trim() : '';
    
    title = title + ' ' + shortDescription
    if (kind === "youtube#video" && title && title.length > 3) {
      if (!channelTitle) {
        channelTitle = itemChannelTitle;
      }
      const name = `${title}#VID${videoId}`;
      names.push(name);
    }
  }

  return { channelTitle, names };
}

module.exports = {
  getRandomAPIKey,
  videoNamesFromChannelID
};
