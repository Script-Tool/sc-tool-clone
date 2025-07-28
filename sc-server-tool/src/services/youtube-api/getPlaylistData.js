const axios = require("axios");

/**
 *
 * @param {*} playlistID
 * @param {*} maxRetries
 * @returns Dữ liệu từ playlist youtube
 *
 * Các file liên quan
 * + routes/admin/jct_playlist.js
 */
async function fetchDataWithRetry(playlistID) {
  try {
    const RAPIDAPI_KEY = "701034935dmshefcb89a6a01c8d0p1de1d2jsn4273dab997f9";
    const options = {
      method: "GET",
      url: "https://yt-api.p.rapidapi.com/playlist",
      params: {
        id: playlistID,
      },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "yt-api.p.rapidapi.com",
      },
    };
    const response = await axios.request(options);
    return response?.data; // Trả về dữ liệu nếu thành công
  } catch (error) {
    console.log(error);
  }
}

module.exports = fetchDataWithRetry;
