const config = require("../config/config");
module.exports = {
  getSystemInfo: async function () {
    try {
      let ProfileModel = await getModel("Profile");
      let totalProfiles = await ProfileModel.countDocuments();
      let errorProfiles = await ProfileModel.countDocuments({
        status: "ERROR",
      });
      let totalVmRunning = 0;
      let totalProfileRunning = 0;
      let totalUsers = 0;
      vmRunnings.forEach((vm) => {
        if (Date.now() - Number(vm.updatedAt) < 320000) {
          totalVmRunning++;
          totalProfileRunning += Number(vm.running);
        }
      });

      let rs = await ProfileModel.aggregate([
        { $match: {} },
        {
          $group: { _id: null, sum: { $sum: "$total_created_users" } },
        },
      ]);

      if (rs && rs[0]) {
        totalUsers = rs[0].sum || 0;
      }

      return {
        profilesRunning: totalProfileRunning,
        totalProfiles,
        errorProfiles,
        vpsRunning: totalVmRunning,
        ip: IP,
        port: PORT,
        totalUsers,
      };
    } catch (e) {
      console.log("error", "getSystemInfo err: ", e);
      return [];
    }
  },

  getProfileInfo: async function () {
    let ProfileModel = await getModel("Profile");
    try {
      let new_profile = await ProfileModel.find({
        status: "NEW",
      }).countDocuments();
      let error = await ProfileModel.find({ status: "ERROR" }).countDocuments();
      let not_ready = await ProfileModel.find({
        is_disabled: true,
      }).countDocuments();
      let suspend = await ProfileModel.find({
        status: "SUSPEND",
      }).countDocuments();
      let reset = await ProfileModel.find({ status: "RESET" }).countDocuments();
      let active = await ProfileModel.find({
        status: { $in: ["SYNCED", "SYNCING"] },
      }).countDocuments();
      let new_profiles = await ProfileModel.find({
        status: "NEW",
      }).countDocuments();
      let trash = await ProfileModel.find({ status: "TRASH" }).countDocuments();
      return {
        active,
        new_profile,
        error,
        not_ready,
        suspend,
        reset,
        new_profiles,
        trash,
      };
    } catch (e) {
      console.log("error", "getSystemInfo err: ", e);
      return [];
    }
  },

  getPlaylistInfo: async function (filter) {
    let VideoModel = await getModel("YoutubeVideo");
    try {
      return await VideoModel.find({});
      // if(!filter || filter == 0){
      //     const [rows,fields] = await db.execute('SELECT * FROM playlist order by create_time desc limit 3000')
      //     return rows
      // }
      // else{
      //     const [rows,fields] = await db.execute('SELECT * FROM playlist where enable = 1')
      //     return rows
      // }
    } catch (e) {
      console.log("error", "getPlaylistInfo err: ", e);
      return [];
    }
  },
  // thêm profile
  insertProfileEmail: async function (profiles, type, headers = []) {
    let ProfileModel = await getModel("Profile");
    try {
      if (["username", "email"].includes(profiles[0][0])) {
        profiles.shift();
      }
      if (headers.length) {
        for await (let row of profiles) {
          let profileData = { type };
          let index = 0;
          headers.forEach((header) => {
            profileData[header] = row[index];
            index++;
          });

          await ProfileModel.create(profileData);
        }
      } else {
        for await (let row of profiles) {
          const email = row[0];

          await ProfileModel.create({
            type,
            email,
            password: row[1],
            recover_mail: row[2],
            proxy_server: row[3] || "",
            status: row[4] || "NEW",
          });
        }
      }

      return { success: true };
    } catch (e) {
      console.log("error", "insertProfileEmail err: ", e);
      return { err: e };
    }
  },
  // Thêm YouTube profile
  insertYoutubeProfile: async function (profiles, type, headers = []) {
    const ProfileModel = await getModel("Profile");
    const YoutubeProfile = await getModel("YoutubeProfile");

    try {
      if (["username", "email"].includes(profiles[0][0])) {
        profiles.shift(); // Xóa dòng tiêu đề nếu có
      }

      if (headers.length) {
        let profileList = [];
        let youtubeList = [];

        for (let row of profiles) {
          let profileData = {};
          let youtubeData = {};
          let index = 0;

          headers.forEach((header) => {
            let value = row[index]?.trim(); // Xử lý lỗi nếu `value` là `undefined`
            index++;

            if (!value) return; // Bỏ qua giá trị trống

            // Dữ liệu cho ProfileModel
            if (
              [
                "email",
                "password",
                "recover_mail",
                "twoFA",
                "proxy_server",
                "proxy_username",
                "proxy_password",
              ].includes(header)
            ) {
              profileData[header] = value;
            }

            // Dữ liệu cho YoutubeProfile (xóa "default_" nếu có)
            if (
              [
                "channel_name",
                "topic",
                "region",
                "default_title",
                "default_description",
                "default_tags",
                "default_keywords",
              ].includes(header)
            ) {
              if (!youtubeData.default_info) {
                youtubeData.default_info = {};
              }
              let cleanHeader = header.replace(/^default_/, ""); // Xóa "default_"

              try {
                if (header.includes("default_")) {
                  youtubeData.default_info[cleanHeader] = value;
                  if (["tags", "keywords"].includes(cleanHeader)) {
                    youtubeData.default_info[cleanHeader] = value.split(",");
                  }
                } else {
                  youtubeData[header] = value;
                }
              } catch (e) {
                console.log(`Lỗi parse JSON ở trường ${cleanHeader}:`, value);
              }
            }
          });

          if (Object.keys(profileData).length) {
            profileList.push(profileData);
          }

          // Gán email của profile vào YoutubeProfile để liên kết
          if (profileData.email) {
            youtubeData.profile_email = profileData.email;
          }

          if (Object.keys(youtubeData).length) {
            youtubeList.push(youtubeData);
          }
        }

        // Chèn tất cả dữ liệu vào MongoDB cùng lúc
        if (profileList.length) {
          await ProfileModel.create(
            profileList.map((item) => ({ ...item, usage_status: "IN_USED" }))
          );
        }
        if (youtubeList.length) {
          await YoutubeProfile.create(youtubeList);
        }
      }

      return { success: true };
    } catch (e) {
      console.log("error", "insertProfileEmail err: ", e);
      return { err: e };
    }
  },
  // Thêm Chatgpt profile
  insertChatgptProfile: async function (profiles, headers = []) {
    const ChatgptProfile = await getModel("ChatgptProfile");

    try {
      if (["username", "email"].includes(profiles[0][0])) {
        profiles.shift(); // Xóa dòng tiêu đề nếu có
      }

      if (headers.length) {
        for await (let row of profiles) {
          let profileData = {};
          let index = 0;
          headers.forEach((header) => {
            profileData[header] = row[index];
            index++;
          });
          await ChatgptProfile.create(profileData);
        }
      }

      return { success: true };
    } catch (e) {
      console.log("error", "insertProfileEmail err: ", e);
      return { err: e };
    }
  },
  addVideo: async function (video) {
    let YTVideo = await getModel("YoutubeVideo");
    try {
      // let dataStr = ''
      // video.forEach((e) => {
      //     dataStr += `'${e}',`
      // });
      // dataStr = dataStr.slice(0, -1);
      await YTVideo.create(video);
      // console.log('dataStr', dataStr);
      //const [result,fields] = await db.query(`insert ignore into playlist (channel_name, playlist_url, total_times, keyword, video, url, url_type) values (${dataStr})`)
      return { success: true };
    } catch (e) {
      console.log("error", "insertPlaylist err: ", e);
      return { err: e };
    }
  },

  stopPlaylist: async function (url) {
    try {
      const [result, fields] = await db.query(
        "update playlist set enable = 0 where url = ?",
        [url]
      );
      return { result: result };
    } catch (e) {
      console.log("error", "stopPlaylist err: ", e);
      return { err: e };
    }
  },
  startVideo: async function (videoId, keyword) {
    try {
      const [rows, fields] = await db.query(
        "select * from playlist where url = ?",
        [videoId]
      );
      if (rows.length == 0) {
        const [result, fs] = await db.query(
          'insert into playlist (url, first_video, url_type, total_times, max_watch_time, enable) values (?,?, "seo", 10, 10000, 1)',
          [videoId, keyword]
        );
        return { result: result };
      } else {
        const [result, fs] = await db.query(
          "update playlist set first_video = ?, enable = 1 where url = ?",
          [keyword, videoId]
        );
        return { result: result };
      }
    } catch (e) {
      console.log("error", "startVideo err: ", e);
      return { err: e };
    }
  },

  stopVideo: async function (videoId) {
    try {
      const [result, fs] = await db.query(
        "update playlist set enable = 0 where url = ?",
        [videoId]
      );
      return { result: result };
    } catch (e) {
      console.log("error", "stopLive err: ", e);
      return { err: e };
    }
  },

  getVideo: async function (videoIds) {
    try {
      let url = "";
      if (videoIds) {
        url = Array(videoIds.length).fill("?").join(",");
        console.log("videoIds:", videoIds, "url:", url);
        const [rows, fs] = await db.query(
          "select * from playlist where url in (" + url + ")",
          videoIds
        );
        return { result: rows };
      } else {
        console.log("videoIds:", videoIds, "url:", url);
        const [rows, fs] = await db.query(
          'select * from playlist where url_type = "seo" and enable = 1'
        );
        return { result: rows };
      }
    } catch (e) {
      console.log("error", "getLive err: ", e);
      return { err: e };
    }
  },
  insertChannel: async function (channels) {
    try {
      const [result, fields] = await db.query(
        "insert ignore into channel (url, keywords, name, enable_sub) values ?",
        [channels]
      );
      return { result: result };
    } catch (e) {
      console.log("error", "insertProfileEmail err: ", e);
      return { err: e };
    }
  },
  updateChannel: async function (ids, enable) {
    try {
      if (enable >= 0) {
        const [result, fields] = await db.query(
          `update channel set enable_sub = ? where id in (${ids})`,
          [enable]
        );
        return { result: result };
      } else {
        const [result, fields] = await db.query(
          `delete from channel where id in (${ids})`
        );
        return { result: result };
      }
    } catch (e) {
      console.log("error", "updateChannel err: ", e);
      return { err: e };
    }
  },

  updateSingleChannel: async function (channel) {
    try {
      const [result, fields] = await db.query(
        `update channel set name = ?, url = ?, keywords = ?, enable_sub = ? where id = ?`,
        channel
      );
      return { result: result };
    } catch (e) {
      console.log("error", "updateSingleChannel err: ", e);
      return { err: e };
    }
  },

  updateSingleVideo: async function (video) {
    try {
      const [result, fields] = await db.query(
        `update playlist set url = ?, url_type = ?, first_video = ?, total_times = ?, max_watch_time = ?, 
                                                    suggest_videos = ?, suggest_percent = ?, hour_view = ?, priority = ?, page_watch = ?, 
                                                    start_time = NULLIF(?,""),stop_time = NULLIF(?,""), enable = ? where id = ?`,
        video
      );
      return { result: result };
    } catch (e) {
      console.log("error", "updateSingleVideo err: ", e);
      return { err: e };
    }
  },

  updateEnoughChannel: async function () {
    try {
      const [result, fields] = await db.query(
        `update channel set enable_sub = 0 where sub is not null and sub >= ?`,
        [config.MAX_CHANNEL_SUBS]
      );
      return { result: result };
    } catch (e) {
      console.log("error", "updateChannel err: ", e);
      return { err: e };
    }
  },

  resetProfileStatus: async function () {
    try {
      const [result, fields] = await db.execute(
        'update profile_email set status = "NEW", subable = 0 where (last_request is null or TIMESTAMPDIFF(MINUTE,GREATEST(last_request,updated_time),now()) > 10) and ((description not like "%Your password was changed%" and description not like "%BLOCKED%") or description is null)'
      );
      return { result: result };
    } catch (e) {
      console.log("error", "resetProfileStatus err: ", e);
      return { err: e };
    }
  },
  resetVpnUse: async function () {
    try {
      const [result, fields] = await db.execute(
        'delete from vpn_use where id not in (select temp.mid from (select max(id) mid from vpn_use where ip in (select substring_index(ip,"\n",1) oip from vm_profile where exists (select vm_id from profile_email pe where pe.vm_id = vm_profile.vm_id and TIMESTAMPDIFF(MINUTE,last_request,now()) <= 10) and substring_index(ip,"\n",-2) != ip) group by ip) temp)'
      );
      return { result: result };
    } catch (e) {
      console.log("error", "resetProfileStatus err: ", e);
      return { err: e };
    }
  },
};
