const MAX_RETRIES = 3; // Số lần thử tối đa
const axios = require('axios');

// Hàm lấy API key từ nguồn khác (ví dụ: cơ sở dữ liệu)
async function getAPIKey() {
  return await getModel("APIKey").getRandomKey("youtube_api");
}

// Hàm lấy thông tin video
async function getVideoInfo(videoId = "", retryCount = 0) {
  if (retryCount >= MAX_RETRIES) {
    console.error("Đã thử quá số lần cho phép, không thể lấy thông tin video.");
    return;
  }

  try {
    const API_KEY = await getAPIKey();
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${API_KEY}&part=snippet,contentDetails,statistics`;

    const response = await axios.get(apiUrl);
    const data = await response.data;

    if (data.items[0]) {
      const videoStats = data.items[0].statistics;
      const likeCount = parseInt(videoStats.likeCount);
      const commentCount = parseInt(videoStats.commentCount);

      return data.items[0]

    } else {
      console.error(`Lỗi: ${data.error}`);
      if (data?.error?.code === 403 && data?.error?.message?.includes("quota")) {
        // Nếu lỗi liên quan đến hạn ngạch, thử lại với API key khác
        await getVideoInfo(videoId, retryCount + 1);
      } else {
        console.error("Lỗi không thể xử lý, không thể lấy thông tin video.");
      }
    }
  } catch (error) {
    console.error("Looxi".  error);
    await getVideoInfo(videoId, retryCount + 1);
  }
}

// Sử dụng hàm lấy thông tin video
module.exports = { getVideoInfo };
