const express = require("express");
var router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "tmp/csv/" });
const csv = require("fast-csv");
const fs = require("fs");
const keywordModule = require("../../modules/keyword");
const path = require("path");
const fetchDataWithRetry = require("../../src/services/youtube-api/getPlaylistData");
const { BATCH_SIZE } = require("../../config/config"); // Import BATCH_SIZE từ file config

router.get("/delete-all", async function (req, res) {
  try {
    let Model = getModel("PlaylistJCT");
    await Model.deleteMany();
    res.send({ success: true });
  } catch (error) {
    console.log(error);
  }
});

/**
 * api để load lại dữ liệu cho jct playlist
 * Những file liên quan:
 *  + public/javascripts/jct_playlist.js
 *  + services/youtube-api/getPlaylistData.js
 *  + views/oam/jct_playlist.ejs
 *  + routes/admin/view.js
 */

router.get("/update-playlists", async (req, res) => {
  try {
    const PlaylistJCT = getModel("PlaylistJCT");
    const Service = getModel("Service");

    const allPlaylistsCount = await PlaylistJCT.countDocuments();
    const totalBatches = Math.ceil(allPlaylistsCount / BATCH_SIZE);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const allPlaylists = await PlaylistJCT.find({})
        .skip(batchIndex * BATCH_SIZE)
        .limit(BATCH_SIZE);

      // Dùng Promise.all để xử lý các playlist đồng thời
      await Promise.all(
        allPlaylists.map(async (playlist) => {
          try {
            const params = new URLSearchParams(playlist.url);
            const playlistId = params.get("list");

            const data = await fetchDataWithRetry(playlistId);

            // Tối ưu việc tìm serviceIdsToUpdate
            const serviceIdsToUpdate = await Service.distinct("_id", {
              data: { $regex: playlistId },
            });

            // Kiểm tra playlist có tồn tại hay không
            if (data.msg == "The playlist does not exist.") {
              await Promise.all([
                serviceIdsToUpdate.length &&
                  Service.updateMany(
                    { _id: { $in: serviceIdsToUpdate } },
                    { is_stop: true }
                  ),
                PlaylistJCT.updateOne(
                  { _id: playlist._id },
                  { is_block: true }
                ),
              ]);
              return; // Dừng xử lý playlist này
            }

            // Cập nhật playlist và service
            countPlayListViews = 0

            if (data?.meta) {
              countPlayListViews += data?.meta?.viewCount
              await Promise.all([
                PlaylistJCT.updateOne(
                  { _id: playlist._id },
                  {
                    total_video: data?.meta?.videoCount,
                    total_view: data?.meta?.viewCount,
                    is_block: false,
                    playlist_name: data?.meta?.title,
                  }
                ),
                serviceIdsToUpdate.length &&
                  Service.updateMany(
                    { _id: { $in: serviceIdsToUpdate } },
                    { is_stop: false }
                  ),
              ]);
            }
          } catch (error) {
            console.error(`Lỗi khi cập nhật playlist ${playlist.url}:`, error);
          }
        })
      );
    }

    console.log("countPlayListViews" , countPlayListViews);
    
    res.status(200).json({ message: "Cập nhật playlists thành công" });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách playlist:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.post(
  "/import-keyword-2",
  upload.single("keywordFile2"),
  async function (req, res) {
    try {
      const fileRows = [];
      csv
        .parseFile(req.file.path)
        .on("data", function (data) {
          fileRows.push(data);
        })
        .on("end", async function () {
          try {
            fs.unlinkSync(req.file.path);
            if (fileRows[0][0].indexOf("sep=") == 0) {
              fileRows.shift();
            }
            if (fileRows[0][0].toLowerCase().indexOf("email") == 0) {
              fileRows.shift();
            }

            for await (let keywordItem of fileRows) {
              if (keywordItem[0]) {
                let data = {
                  playlist_name: keywordItem[0],
                  pll_description: keywordItem[1] || "",
                  suggest_channel: keywordItem[2] || "",
                  total_added_from_search: "",
                  total_added_from_channel: "",
                };
                await getModel("Service").create({
                  script_code: "create_playlist",
                  data: JSON.stringify(data),
                  remaining: -1,
                  start_max_time: 900000,
                  end_max_time: 900000,
                });
              }
            }
            res.send({});
          } catch (e) {
            console.log("insert-profile-email err:", e);
            return res.send(e);
          }
        })
        .on("error", function (e) {
          console.error("parse profile err:", e);
          return res.send(e);
        });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(
  "/import-keyword",
  upload.single("keywordFile"),
  async function (req, res) {
    try {
      let Playlist = getModel("Playlist");

      let limit_per_keyword = req.query.limit_per_keyword || 50;
      const fileRows = [];

      csv
        .parseFile(req.file.path)
        .on("data", function (data) {
          fileRows.push(data); // push each row
        })
        .on("end", async function () {
          try {
            fs.unlinkSync(req.file.path);
            if (fileRows[0][0].indexOf("sep=") == 0) {
              fileRows.shift();
            }
            if (fileRows[0][0].toLowerCase().indexOf("email") == 0) {
              fileRows.shift();
            }

            for await (let keywordItem of fileRows) {
              let mainKeyword = keywordItem[0];

              async function exec() {
                let keywords = await keywordModule.getKeywordsForAdmin({
                  keyword: mainKeyword,
                  limit: Number(limit_per_keyword),
                });
                for await (let keyword of keywords) {
                  Playlist.loadCreatePlaylistServices({
                    keyword: keyword,
                    tags: mainKeyword || "",
                    suggest_channel: "",
                  });
                }
                return keywords;
              }

              let rs = await exec();
              if (!rs.length) {
                await exec();
              }
            }
            return res.send({});
          } catch (e) {
            console.log("insert-profile-email err:", e);
            return res.send(e);
          }
        })
        .on("error", function (e) {
          console.error("parse profile err:", e);
          return res.send(e);
        });
    } catch (error) {
      console.log(error);
    }
  }
);

router.get("/set-channel", async function (req, res) {
  try {
    let channel = req.query.channelID;
    let filter = {};
    if (req.query.tag) {
      filter.tag = { $regex: req.query.tag };
    }

    if (req.query.countVideo) {
      if (req.query.typeCountVideo == "=") {
        filter.total_video = req.query.countVideo;
      } else {
        filter.total_video = {
          [req.query.typeCountVideo]: Number(req.query.countVideo),
        };
      }
    }

    if (req.query.countView) {
      if (req.query.typeCountView == "=") {
        filter.total_view = req.query.countView;
      } else {
        filter.total_view = {
          [req.query.typeCountView]: Number(req.query.countView),
        };
      }
    }

    const PlaylistJCT = getModel("PlaylistJCT");
    const playlistJCTs = await PlaylistJCT.find(filter);
    const playlistUrls = playlistJCTs.map((playlistJCT) => playlistJCT.url);

    if (channel && req.query.script_code) {
      const Service = getModel("Service");

      async function updateChannelID(sv) {
        try {
          let data = JSON.parse(sv.data);
          data.suggest_channel = channel;
          await Service.updateOne(
            { _id: sv._id },
            {
              $set: {
                start_max_time: 1,
                end_max_time: 1,
                data: JSON.stringify(data),
              },
            }
          );
        } catch (error) {
          console.log("error", error);
        }
      }

      const per_page = 200;
      let current_page = 1;
      let svs = [];

      while (true) {
        svs = await Service.find({
          script_code: req.query.script_code,
          data: { $regex: playlistUrls.map((url) => `${url}`).join("|") },
        })
          .skip((current_page - 1) * per_page)
          .limit(per_page);

        if (svs.length === 0) {
          break;
        }
        await Promise.all(svs.map(updateChannelID));
        current_page++;
      }

      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log("error", error);
  }
});

// Sử dụng global.getModel để lấy PlaylistJCT

// Export tất cả playlists
router.get("/export", async (req, res) => {
  try {
    const PlaylistJCT = getModel("PlaylistJCT");
    const playlists = await PlaylistJCT.find().sort("playlist_name");
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: "Error exporting playlists" });
  }
});

// Import playlists
router.post("/import", async (req, res) => {
  try {
    const playlists = req.body;
    const PlaylistJCT = getModel("PlaylistJCT");

    await PlaylistJCT.insertMany(playlists, { ordered: false }).catch(
      (error) => {
        if (error.code === 11000) {
          console.log("Duplicate keys found, skipping duplicates");
        } else {
          throw error;
        }
      }
    );
    res.json({ success: true, message: "Playlists imported successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error importing playlists" });
  }
});

module.exports = express.Router().use(router);
