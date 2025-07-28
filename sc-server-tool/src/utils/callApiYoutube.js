/*
 * người viết: Đinh Văn Thành
 * ngày viết: 10/04/2024
 * Chức năng: call api của youtube để lấy ra dữ liệu
 * Tham số truyền vào : playlist_url là mã của video
 * Ví Dụ: https://www.youtube.com/watch?v=PBUlu2SfziU =>  PBUlu2SfziU là mã của video cần lấy để truyền vào tham số playlist_url
 */

const axios = require("axios");
async function initializeCallApiYoutube(playlist_url) {
  if (playlist_url) {
    let i = 0;
    do {
      let APIKEY = getModel("APIKey");
      const YOUTUBE_API_KEY =
        (await APIKEY.getRandomKey("rapidapi")) ||
        "701034935dmshefcb89a6a01c8d0p1de1d2jsn4273dab997f9";
      const options = {
        method: "GET",
        url: "https://yt-api.p.rapidapi.com/shorts/info",
        params: { id: playlist_url },
        headers: {
          "X-RapidAPI-Key": YOUTUBE_API_KEY,
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
        } else {
          i = 4;
        }
      });
      if (response && response.data && response.status == 200) {
        let items = response.data;
        i = 4;
        if (items.error) {
        } else {
          return items;
        }
      }
    } while (i < 3);
  } else {
    console.log("error initializeCallApiYoutube");
  }
}
/*
 * Người viết: Đinh Văn Thành
 * Ngày viết: 15/04/2024
 * Chức năng: call api của youtube để lấy ra dữ liệu
 * Tham số truyền vào : id_channel là mã của kênh, flag là cờ để phân biệt lấy giá trị rút gọn hay lấy giá trị toàn bộ
 */
async function initializeCallApiYoutubeChannel(id_channel, flag) {
  if (id_channel && flag) {
    let i = 0;
    do {
      let APIKEY = getModel("APIKey");
      const YOUTUBE_API_KEY =
        "493d755d50msh92b96671de3218cp12004cjsn103911b533db";
      // const options = {
      //   method: "GET",
      //   url: "https://youtube-v2.p.rapidapi.com/channel/videos",
      //   params: { channel_id: id_channel },
      //   headers: {
      //     "X-RapidAPI-Key": YOUTUBE_API_KEY,
      //     "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
      //   },
      // };

      const options = {
        method: "GET",
        url: "https://youtube-v2.p.rapidapi.com/channel/videos",
        params: {
          channel_id : id_channel,
        },
        headers: {
          "x-rapidapi-key":
            "493d755d50msh92b96671de3218cp12004cjsn103911b533db",
          "x-rapidapi-host": "youtube-v2.p.rapidapi.com",
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
        } else {
          i = 4;
        }
      });
      if (response && response?.data && response.status == 200) {
        i = 4;
        if (response.data.code == "403") {
          console.log("error", response.data.code);
        } else {
          if (flag == 1) {
            return response.data.meta;
          } else {
            return response.data;
          }
        }
      }
    } while (i < 3);
  } else {
    console.log("initializeCallApiYoutubeChannel");
  }
}
/*
* Người viết: Đinh Văn Thành
* Ngày viết: 15/04/2024
* Chức năng: tính toán mà cập nhật trạng thái của Service
* Tham số truyền vào:- rs_Count là kết quả trả về từ api youtube
                     - service là dữ liệu của để chạy script 
                     - id là id trong table Service
                     -  flag là một biến để phân bết là gọi vào api update hay là api report
                     nếu flag = 1 => api /report | flag = 2 => api update 
*/

async function updateServiceStatus(serviceId, status, remaining) {
  try {
    const result = await getModel("Service").updateOne(
      { _id: serviceId },
      { $set: { is_stop: status, remaining } }
    );
    if (result.nModified === 0) {
      throw new Error("Không tìm thấy service để cập nhật");
    }
    return result;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật trạng thái service: ${error.message}`);
  }
}

async function updateServiceData(service, data) {
  try {
    const result = await getModel("Service").updateOne(
      { id: service.update_id },
      data
    );
    if (result.nModified === 0) {
      throw new Error("Không tìm thấy service để cập nhật dữ liệu");
    }
    return result;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật dữ liệu service: ${error.message}`);
  }
}

async function initializeStatusService(rsCount, service, id, flag) {
  try {
    if (!rsCount || !service || !id || !flag) {
      console.log("rsCount", rsCount, service.remaining, id, flag);
      throw new Error("Thiếu thông tin đầu vào");
    }

    const {
      first_data_reported_watch_new,
      remaining,
      _id,
      fisrt_remaining,
      fisrt_value_log,
    } = service;

    if (flag === 1) {
      const currentValue = Number(rsCount.toString());
      const targetValue =
        Number(first_data_reported_watch_new) ||
        fisrt_remaining + Number(fisrt_value_log);

      console.log(
        "Giá trị hiện tại và giá trị mục tiêu:",
        currentValue,
        targetValue
      );

      if (isNaN(currentValue) || isNaN(targetValue)) {
        throw new Error("Giá trị không hợp lệ");
      }

      if (currentValue >= targetValue) {
        await updateServiceStatus(_id, null, 0);
      } else if (currentValue < targetValue) {
        let total = targetValue - currentValue;
        total = total + Math.ceil(total * 0.1);
        const date = new Date().getDate();
        logBh[date] = (logBh[date] || 0) + total;
        await updateServiceStatus(_id, null, total);
      }
    } else if (flag === 2) {
      const newData = {
        first_data_reported: rsCount.toString(),
        total_remaining_new: Number(remaining),
        first_data_reported_watch_new: (
          Number(remaining) + Number(rsCount.toString())
        ).toString(),
      };
      await updateServiceData(service, newData);
    } else {
      throw new Error("Cờ không hợp lệ");
    }
  } catch (error) {
    console.error("Lỗi trong initializeStatusService:", error);
  }
}

/*
 * Người viết: Đinh Văn Thành
 * Ngày viết: 25/04/2024
 * Chức năng: call api của youtube để lấy ra dữ liệu với tên của channel tương ứng
 * Tham số truyền vào: channelName là tên của channel
 */

async function getChannelID(channelName) {
  if (channelName) {
    let i = 0;
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
          forUsername: channelName,
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
        } else {
          i = 4;
        }
      });
      if (response && response?.data && response.status == 200) {
        i = 4;
        if (response.data.error) {
          console.log("error");
        } else {
          let channelId = response.data.meta.channelId;
          return channelId;
        }
      }
    } while (i < 3);
  } else {
    console.log("error");
  }
}
/*
 * Người viết: Đinh Văn Thành
 * Ngày viết: 25/04/2024
 * Chức năng: call api của youtube để lấy ra dữ liệu với tên của video tương ứng
 * Tham số truyền vào: videoName là tên của video
 */
async function getVideoFroName(videoName) {
  if (videoName) {
    let i = 0;
    do {
      let APIKEY = getModel("APIKey");
      const YOUTUBE_API_KEY =
        (await APIKEY.getRandomKey("rapidapi")) ||
        "701034935dmshefcb89a6a01c8d0p1de1d2jsn4273dab997f9";
      const options = {
        method: "GET",
        url: `https://yt-api.p.rapidapi.com/search`,
        params: {
          query: videoName,
          type: "video",
        },
        headers: {
          "X-RapidAPI-Key": YOUTUBE_API_KEY,
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
        } else {
          i = 4;
        }
      });
      if (response && response?.data && response.status == 200) {
        i = 4;
        if (!response.data.error) {
          var items = response.data.data.slice(0, 5).map((item) => {
            return item;
          });
          return items;
        }
      }
    } while (i < 3);
  }
}
module.exports = {
  initializeCallApiYoutube: initializeCallApiYoutube,
  initializeCallApiYoutubeChannel: initializeCallApiYoutubeChannel,
  initializeStatusService: initializeStatusService,
  getChannelID: getChannelID,
  getVideoFroName: getVideoFroName,
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
