const express = require("express");
var router = express.Router();
const modelName = "Service";
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: "tmp/csv/" });
const csv = require("fast-csv");
const keywordModule = require("../../modules/keyword");
const apiYoutbe = require("../../src/utils/callApiYoutube");
const { getLogCode } = require("../../src/utils/getLogCode");
const {
  getChannelInfo,
} = require("../../src/services/youtube-api/getChannelInfo");
const {
  videoNamesFromChannelID,
} = require("../../src/services/youtube-api/videoNamesFromChannelID");
const { getVideoInfo } = require("../../src/services/youtube-api/getVideoInfo");
const { default: mongoose } = require("mongoose");
const getChannelID = require("../../src/services/rapidapi-api/getChannelID");
let cacheBH = [];
const { google } = require("googleapis");
const rateLimit = require("express-rate-limit");
const {
  getVideoTitlesFromChannel,
} = require("../../src/services/youtubeService");
const youtubeService = require("../../src/services/youtubeService");
const youtubeController = require("../../src/controllers/youtubeController");
const {
  checkAndCompleteYouTubeServices,
} = require("../../src/services/checkAndCompleteYouTubeServices");
const {
  updateOrderStatus,
} = require("../../src/services/topclick/orderService");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
/**
 * Thay đổi trạng thái các dịch vụ đã chọn
 * Dừng, Chạy , Xóa , Sửa
 * Sửa mô tả play list
 */
router.post("/status", async function (req, res) {
  try {
    const { action = "", selectedIds = [], updatedDescription = "" } = req.body;
    const ServiceModel = getModel("Service");
    const objectIds = selectedIds.map((id) => mongoose.Types.ObjectId(id));

    switch (action) {
      case "stop":
        await ServiceModel.updateMany(
          { _id: { $in: objectIds } },
          { is_stop: true }
        );
        res.json({
          message: "Các dịch vụ đã được dừng thành công!",
          selectedIds: selectedIds,
        });
        break;
      case "start":
        await ServiceModel.updateMany(
          { _id: { $in: objectIds } },
          { is_stop: false }
        );
        res.json({
          message: "Các dịch vụ đã được khởi động thành công!",
          selectedIds: selectedIds,
        });
        break;
      case "delete":
        await ServiceModel.deleteMany(
          { _id: { $in: objectIds } },
          { is_stop: false }
        );
        res.json({
          message: "Các dịch vụ đã được xóa thành công!",
          selectedIds: selectedIds,
        });
        break;
      case "playlist_description":
        try {
          // Lấy các document cần cập nhật
          const servicesToUpdate = await ServiceModel.find({
            _id: { $in: objectIds },
          });

          // Cập nhật từng document
          for (const service of servicesToUpdate) {
            // Kiểm tra nếu data là một chuỗi
            if (typeof service.data === "string") {
              try {
                // Phân tích chuỗi JSON và cập nhật pll_description
                const parsedData = JSON.parse(service.data);
                parsedData.pll_description = updatedDescription;
                // Lưu lại dữ liệu đã cập nhật vào document
                service.data = JSON.stringify(parsedData);
                await service.save();
              } catch (error) {
                console.error("Lỗi khi phân tích JSON:", error);
                // Xử lý lỗi phân tích JSON nếu cần
              }
            } else {
              console.error("Dữ liệu không phải là chuỗi JSON");
              // Xử lý trường hợp dữ liệu không phải là chuỗi JSON
            }
          }

          res.json({
            message: "Mô tả playlist đã được cập nhật thành công!",
            selectedIds: objectIds,
          });
        } catch (error) {
          console.error("Lỗi khi cập nhật mô tả playlist:", error);
          res
            .status(500)
            .json({ error: "Đã xảy ra lỗi khi cập nhật mô tả playlist." });
        }
        break;
      default:
        res.status(400).json({ message: "Hành động không hợp lệ!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/loadsubdata", async function (req, res) {
  const ServiceModel = getModel("Service");
  let currentPage = 0;
  const perPage = 500;
  // Lấy lại thông tin kênh
  async function exec(sv) {
    try {
      let data = JSON.parse(sv.data);
      let channelID = data.channel_id;
      if (!channelID.startsWith("channel/")) {
        return;
      }
      let updateData = {};
      channelID = channelID.replace("channel/", "");
      channelID = channelID.replace(/\/$/, "");
      updateData.channel_id = `channel/${channelID}`;

      if (sv?.note?.includes("undefined") || sv?.note?.includes("NaN"))
        if (
          (!sv.first_data_reported || sv.first_data_reported == "NaN") &&
          (!sv.fisrt_value_log || sv?.fisrt_value_log == "NaN")
        ) {
          // Lấy số sub nếu số sub ban đầu bị lỗi

          const channelInfo = await getChannelInfo(channelID);
          const subscriberCount = channelInfo?.subscriberCount;
          if (subscriberCount) {
            updateData.first_data_reported = subscriberCount;
            updateData.fisrt_value_log = subscriberCount;

            updateData.note = `${subscriberCount} + ${sv.fisrt_remaining} = ${
              Number(subscriberCount) + Number(sv.fisrt_remaining)
            }`;
            // Kiểm tra sv.fisrt_remaining trước khi cộng với subscriberCount
            if (!isNaN(sv.fisrt_remaining)) {
              updateData.first_data_reported_watch_new =
                subscriberCount + parseInt(sv.fisrt_remaining);
            }
            updateData.note = `${updateData.fisrt_value_log} + ${
              sv.fisrt_remaining
            } = ${
              Number(updateData?.fisrt_value_log) + Number(sv?.fisrt_remaining)
            }`;
          }
        }

      // Lấy tên video
      if (Array.isArray(sv.names) && sv.names.length >= 3 && sv.channel_title) {
      } else {
        let rs = await videoNamesFromChannelID(channelID);

        if (rs && rs.names && Array(rs.names) && rs.names.length) {
          updateData.names = rs.names;
        }
        if (rs.channelTitle) {
          updateData.channel_title = rs.channelTitle;
        }
      }

      if (Object.keys(updateData).length) {
        await sv.updateOne(updateData);
      }
    } catch (error) {
      console.log("/loadsubdata error", error);
    }
  }

  while (true) {
    const services = await ServiceModel.find({ script_code: "youtube_sub" })
      .skip(currentPage * perPage)
      .limit(perPage);
    if (!services || !services.length) {
      break;
    }
    await Promise.all(services.map((sv) => exec(sv)));
    currentPage++;
  }

  res.json({});
});

router.get("/baohanh/:script_code", async function (req, res) {
  cacheBH = [];
  if (res.role != "super_admin") {
    return res.json({ success: false });
  }

  let script_code = req.params.script_code;

  await getModel("Service").updateMany(
    {
      script_code: script_code,
      status: { $in: ["loibaohanh", "baohanh", "hoantat"] },
    },
    {
      status: "",
    }
  );

  let baohanh = 0;
  let loibaohanh = 0;
  let hoantat = 0;
  try {
    let query = {
      is_stop: { $ne: true },
      script_code: script_code,
      remaining: { $in: [0] },
      status: { $nin: ["loibaohanh", "baohanh", "hoantat"] },
    };
    if (req.query.refresh) {
      query.remaining = { $gte: 0 };
    }

    let limit = 300;
    if (req.query.limit) {
      limit = Number(req.query.limit);
    }

    async function exec(service) {
      try {
        let data = JSON.parse(service.data);
        const subData = await getModel("Order").getCurrentValue(
          service.script_code,
          data
        );
        let currentValue = subData?.subscriberCount;
        if (!currentValue) {
          throw "notfound";
        }

        let targetValue =
          Number(service.fisrt_value_log) + Number(service.fisrt_remaining);
        let remaining = targetValue - currentValue;
        if (remaining >= 0) {
          remaining += Math.floor((remaining * 30) / 100);
          const today = new Date().getDate();
          logBh[today] = (logBh[today] || 0) + remaining;

          await service.updateOne({
            remaining: remaining,
            status: "baohanh",
            $inc: { total_remaining: remaining },
          });
          baohanh++;
        } else {
          await service.updateOne({
            data_reported: currentValue + "-count",
            status: "hoantat",
          });
          hoantat++;
        }
      } catch (error) {
        console.error(error);
        let errorUpdate = { status: "loibaohanh" };
        if (
          typeof error == "string" &&
          error.includes("Không tìm thấy kênh, vui lòng kiểm tra lại ID kênh")
        ) {
          errorUpdate.is_stop = true;
          errorUpdate.remaining = 0;
        }
        await service.updateOne(errorUpdate);
        loibaohanh++;
      }
    }

    let subServices = await getModel("Service").find(query).limit(limit);
    while (subServices.length) {
      await Promise.all(
        subServices.map((sv) => {
          return exec(sv);
        })
      );

      subServices = await getModel("Service").find(query).limit(limit);
    }

    let bhRes = { success: true, baohanh, loibaohanh, hoantat };
    console.log(bhRes);
    cacheBH = [];
    return res.json(bhRes);
  } catch (error) {
    console.error(error);
    return res.json({ success: false });
  }
});

router.get("/set-channel", async function (req, res) {
  try {
    let channel = req.query.channelID;
    if (channel && req.query.script_code) {
      let Service = getModel("Service");

      async function updateChannelID(sv) {
        try {
          let data = JSON.parse(sv.data);
          data.suggest_channel = channel;
          await sv.updateOne({
            $set: {
              start_max_time: 1,
              end_max_time: 1,
              data: JSON.stringify(data),
            },
          });
        } catch (error) {
          console.error(error);
        }
      }
      let svs = [];
      const per_page = 200;
      let current_page = 1;
      do {
        svs = await Service.find({ script_code: req.query.script_code })
          .skip((current_page - 1) * per_page)
          .limit(per_page);
        current_page++;
        if (svs.length) {
          await Promise.all(svs.map((sv) => updateChannelID(sv)));
        }
      } while (svs.length);
      res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
  }
});

router.get("/set-timer", async function (req, res) {
  try {
    let timer = Number(req.query.timer);
    let Service = getModel("Service");
    let filter = Service.getFilter(req);

    if (!timer) {
      timer = 0;
    }
    await Service.updateMany(filter, {
      $set: { start_max_time: timer, end_max_time: timer },
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
  }
});

router.get("/set-timer", async function (req, res) {
  try {
    let timer = Number(req.query.timer);
    let Service = getModel("Service");
    let filter = Service.getFilter(req);

    if (!timer) {
      timer = 0;
    }
    await Service.updateMany(filter, {
      $set: { start_max_time: timer, end_max_time: timer },
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
  }
});

// Thêm endpoint mới vào file routes/api/index.js hoặc routes/admin/script.js
// dựa vào cấu trúc project hiện tại

/**
 * API để cập nhật comment_percent và like_percent cho dịch vụ YouTube
 *
 * Method: GET
 * URL: /update-interaction
 * Query Parameters:
 *  - comment_percent: Phần trăm comment (tuỳ chọn)
 *  - like_percent: Phần trăm like (tuỳ chọn)
 *  - code: Script code (bắt buộc, mặc định là youtube_sub)
 *  - id: ID của service (tuỳ chọn)
 *  - Các tham số khác được sử dụng trong Service.getFilter()
 *
 * Response: JSON { success: true/false, updated: số lượng bản ghi đã cập nhật }
 */
router.get("/update-interaction", async function (req, res) {
  try {
    const comment_percent = req.query.comment_percent_value
      ? Number(req.query.comment_percent_value)
      : 0;
    const like_percent = req.query.like_percent_value
      ? Number(req.query.like_percent_value)
      : 0;

    // Kiểm tra xem có ít nhất một tham số cần cập nhật
    if (comment_percent === null && like_percent === null) {
      return res.json({
        success: false,
        message:
          "Vui lòng cung cấp ít nhất một trong các tham số: comment_percent, like_percent",
      });
    }

    // Lấy Service model
    const Service = getModel("Service");

    // Tạo bộ lọc từ request
    const filter = Service.getFilter(req);

    // Chuẩn bị đối tượng cập nhật
    const updateObj = {};

    // Chỉ thêm các tham số được cung cấp vào đối tượng cập nhật
    if (comment_percent !== null) {
      updateObj["data.comment_percent"] = comment_percent.toString();
    }

    if (like_percent !== null) {
      updateObj["data.like_percent"] = like_percent.toString();
    }

    // Nếu service đã lưu data dưới dạng JSON string, cần xử lý đặc biệt
    const services = await Service.find(filter);
    let updatedCount = 0;

    // Cập nhật từng service một để xử lý trường hợp data là JSON string
    for (const service of services) {
      let data = service.data;

      // Nếu data là string, chuyển đổi thành object
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (err) {
          console.error(`Lỗi khi parse data của service ${service.id}:`, err);
          continue;
        }
      }

      // Cập nhật các giá trị
      if (comment_percent !== null) {
        data.comment_percent = comment_percent.toString();
      }

      if (like_percent !== null) {
        data.like_percent = like_percent.toString();
      }

      // Lưu lại vào database
      await service.updateOne({ data: JSON.stringify(data, null, "\t") });
      updatedCount++;
    }

    res.json({
      success: true,
      updated: updatedCount,
      message: `Đã cập nhật ${updatedCount} dịch vụ thành công`,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật tham số tương tác:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại sau.",
    });
  }
});

router.get("/load-service-time", async function (req, res) {
  try {
    let APIKey = getModel("APIKey");
    let Service = getModel("Service");

    async function loadServiceTime(service, retry = 0) {
      if (retry >= 5) {
        return;
      }

      let apiKey = await APIKey.getRandomKey("youtube_api");
      let channelID = null;
      let regexp = /channel\/[\w|.]*[/|"]/;
      let match = regexp.exec(service.data);
      if (match && match[0]) {
        channelID = match[0];
        channelID = channelID.replace("channel/", "");
        channelID = channelID.replace("/", "");
        channelID = channelID.replace('"', "");
      }

      if (channelID) {
        /*
         * Người viết: Đinh Văn Thành
         * Ngày Viết: 23-04-2024
         * Chức Năng: Thay thế https://www.googleapis.com/youtube/v3 thành api mới
         */
        if (channelID) {
          const response = await apiYoutbe.initializeCallApiYoutubeChannel(
            channelID,
            2
          );
          if (response && response.data) {
            let items = response.data;
            if (items && items.length) {
              await Service.updateOne(
                { id: service.id },
                { $set: { start_max_time: 123456, end_max_time: 123456 } }
              );
            }
          } else {
            loadServiceTime(service, retry + 1);
          }
        }
        // ================= END ======================
      }
    }

    let services = await Service.find({ script_code: "youtube_sub" });
    for (let sv of services) {
      loadServiceTime(sv);
    }

    res.send({ success: true });
  } catch (e) {
    res.send({ err: e });
  }
});

router.get("/reset-counter", async function (req, res) {
  try {
    let Service = getModel("Service");

    await Service.updateMany(
      { script_code: "youtube_sub" },
      { $set: { executed: 0, first_data_reported: "", data_reported: "" } }
    );

    res.send({ success: true });
  } catch (e) {
    res.send({ err: e });
  }
});

router.post("/create-playlist-from-keyword", async function (req, res) {
  try {
    let data = req.body;
    if (data.keyword) {
      let Playlist = getModel("Playlist");
      let keywords = await keywordModule.getKeywordsForAdmin({
        keyword: data.keyword,
        limit: data.limit,
      });

      let dess = (data.pll_description || "").split("#");
      for await (let keyword of keywords) {
        let randomPos = Math.floor(Math.random() * dess.length);
        let pllDes = dess[randomPos];
        Playlist.loadCreatePlaylistServices({
          keyword: keyword,
          tags: data.tags || "",
          suggest_channel: data.suggest_channel || "",
          pll_description: pllDes || "",
        });
      }
    }

    res.send({ success: true });
  } catch (e) {
    console.error(e);
    res.send({ err: e });
  }
});

router.post("/import", upload.single("serviceFile"), async function (req, res) {
  try {
    let ServiceModel = getModel("Service");
    let PlaylistJCT = getModel("PlaylistJCT");

    console.log("insert-service");
    const fileRows = [];
    // open uploaded file
    csv
      .parseFile(req.file.path)
      .on("data", function (data) {
        fileRows.push(data); // push each row
      })
      .on("end", async function () {
        try {
          fs.unlinkSync(req.file.path);
          let titles = fileRows.shift();

          for await (let row of fileRows) {
            try {
              let data = {};
              let index = 0;

              titles.forEach((key) => {
                if (
                  ![
                    "no_warranty",
                    "names",
                    "channel_title",
                    "createdAt",
                    "_id",
                  ].includes(key)
                ) {
                  if (key == "data") {
                    data[key] = row[index].replace(/PLUS/g, ",");
                  } else if (key == "order_id") {
                    // Đảm bảo order_id được xử lý đúng cách
                    data[key] = row[index] ? row[index].trim() : null;
                  } else {
                    data[key] = row[index];
                  }
                }

                index++;
              });

              data.one_time = false;

              if (data.script_code == "add_video_playlist") {
                try {
                  let svData = JSON.parse(data.data);
                  await PlaylistJCT.create({
                    url: svData.playlist_url,
                    playlist_name: svData.playlist_name,
                    tag: data.note,
                  });
                } catch (error) {
                  console.log("data.data", data.data);
                  console.log(error);
                }
              }

              data.is_from_import = true;

              // Kiểm tra xem service với order_id này đã tồn tại chưa
              if (data.order_id) {
                const existingService = await ServiceModel.findOne({
                  order_id: data.order_id,
                });
                if (existingService) {
                  // Nếu đã tồn tại, cập nhật thay vì tạo mới
                  await ServiceModel.updateOne(
                    { order_id: data.order_id },
                    data
                  );
                } else {
                  // Nếu chưa tồn tại, tạo mới
                  await ServiceModel.create(data);
                }
              } else {
                // Nếu không có order_id, tạo mới như bình thường
                await ServiceModel.create(data);
              }
            } catch (error) {
              console.log("----", error, row);
            }
          }
          res.send({ success: true });
        } catch (e) {
          console.log("insert-service err:", e);
          res.send(e);
        }
      });
  } catch (e) {
    console.log("insert-service err:", e);
    res.send(e);
  }
});

router.get("/export", async function (req, res) {
  let no_delete = req.query.no_delete;
  let ServiceModel = getModel("Service");
  let PlaylistJCT = getModel("PlaylistJCT");
  let filter = ServiceModel.getFilter(req);
  let limit = 5000;

  let rows = await ServiceModel.find(
    filter,
    "-names -channel_title -updatedAt -__v -update_id -last_report_time -count -one_time"
  ).limit(limit);
  if (!rows.length) {
    return res.json({ success: false });
  }

  let titles = Object.keys(rows[0].toObject());
  if (!titles.includes("fisrt_value_log")) {
    titles.push("fisrt_value_log");
  }
  if (!titles.includes("order_id")) {
    titles.push("order_id");
  }

  let stringData = titles.join(",");
  let dir = "export";

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let filename = `${dir}/services-${Date.now()}.csv`;
  fs.writeFileSync(filename, stringData);
  stringData = "";
  let deletedIDs = [];
  while (rows.length) {
    for (let row of rows) {
      stringData += "\n";
      row = row.toObject();
      if (row.script_code == "add_video_playlist") {
        try {
          await PlaylistJCT.deleteMany({
            url: JSON.parse(row.data).playlist_url.trim(),
          });
        } catch (error) {
          console.log("row.data", row.data);
          console.log(error);
        }
      }

      row.data = row.data.replace(/\n/g, "");
      row.data = row.data.replace(/ /g, "");
      row.data = row.data.replace(/,/g, "PLUS");

      if (row.data_reported) {
        row.data_reported = row.data_reported.replace(/,/g, ".");
      }

      if (row.first_data_reported) {
        row.first_data_reported = row.first_data_reported.replace(/,/g, ".");
      }

      titles.forEach((key) => {
        if (row[key] == undefined) {
          stringData += ",";
        } else {
          stringData += (row[key] + "").replace(/,/g, ".") + ",";
        }
      });

      if (stringData.endsWith(",")) {
        stringData = stringData.slice(0, -1);
      }
    }

    if (stringData) {
      fs.appendFileSync(filename, stringData);
      stringData = "";

      let rowIds = rows.map((row) => row.id);

      if (!no_delete) {
        await ServiceModel.deleteMany({ id: { $in: rowIds } });
      } else {
        deletedIDs.push(...rowIds);
        filter.id = { $nin: deletedIDs };
      }

      rows = await ServiceModel.find(
        filter,
        "-createdAt -updatedAt -__v"
      ).limit(limit);
    } else {
      rows = [];
      return res.json({ success: false });
    }
  }

  let filePath = path.join(rootDir, filename);
  res.sendFile(filePath);
});

router.get("/update-default-data", async function (req, res) {
  try {
    let data = req.query;
    let script_code = data.script_code;
    if (script_code) {
      let Script = await getModel("Script");
      let script = await Script.findOne({ code: script_code });
      if (script) {
        await script.updateOne({ default_service_data: data });
      }
    }

    res.send({ success: true });
  } catch (e) {
    res.send({ err: e });
  }
});

router.get("/delete-all", async function (req, res) {
  try {
    let script_code = req.query.code;
    if (script_code) {
      let Model = await getModel(modelName);
      let filter = Model.getFilter(req);
      await Model.deleteMany(filter);
    }

    res.send({ success: true });
  } catch (e) {
    res.send({ err: e });
  }
});

router.get("/get-service", async function (req, res) {
  try {
    let data = req.query;
    let Model = await getModel(modelName);
    let service = await Model.findOne({ _id: data.id });
    res.send({ service: service });
  } catch (e) {
    res.send({ err: e });
  }
});

router.post("/add", async function (req, res) {
  try {
    let data = req.body; // Thay đổi từ req.query sang req.body
    let Model = await getModel(modelName);

    if (res.role == "super_admin") {
      if (data.script_code == "youtube_sub") {
        data.disable_log = true;
        await Model.create(data);
      } else {
        data.disable_log = true;
        await Model.create(data);
      }
    }

    res.send({ success: true });
  } catch (e) {
    console.log("error", e);
    res.status(500).send({ err: e }); // Thêm status code phù hợp
  }
});

router.put("/update", async function (req, res) {
  try {
    let newService = req.body; // Lấy data từ body thay vì query
    let serviceModel = await getModel(modelName);

    // Kiểm tra xem có ID không
    if (!newService.update_id) {
      return res.status(400).send({
        success: false,
        error: "Missing update_id",
      });
    }
    const service = await serviceModel.findOne({ id: newService.update_id });
    let serviceCurrentData = JSON.parse(service.data);
    let serviceNewData = JSON.parse(newService.data);
    newService.data = JSON.stringify({
      ...serviceCurrentData,
      ...serviceNewData,
    });

    const result = await service.updateOne(newService);

    // Kiểm tra kết quả update
    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        error: "Record not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Updated successfully",
    });
  } catch (e) {
    console.error("Error updating " + modelName + ": ", e);
    res.status(500).send({
      success: false,
      error: e.message,
    });
  }
});

router.get("/delete", async function (req, res) {
  try {
    let id = req.query.id;
    let Model = await getModel(modelName);
    const rsDelete = await Model.deleteOne({ _id: id });
    if (rsDelete) {
    }
    res.send({});
  } catch (e) {
    res.send({ err: e });
  }
});

router.get("/add-videos-from-channel", async function (req, res) {
  try {
    let data = req.query;

    if (data.channel_id) {
      let channel_id = data.channel_id;
      if (channel_id.startsWith("@")) {
        let newChannelID = await apiYoutbe.getChannelID(channel_id);
        if (newChannelID) {
          channel_id = newChannelID.channelId;
        }
      } else if (channel_id.includes("channel/")) {
        channel_id = channel_id.replace("channel/", "");
      }
      let Service = await getModel("Service");
      let maxVideos = data.max_videos || 20;
      const response = await apiYoutbe.initializeCallApiYoutubeChannel(
        channel_id,
        2
      );

      console.log("response", response, channel_id);
      const Script = getModel("Script");
      const rs = await Script.findOne({ code: "watch_video" });
      const default_service_data = rs.default_service_data || {};
      console.log("default_service_data", default_service_data);
      if (response && response.videos) {
        // Since we don't have meta data in the response, we'll handle without channel title/handle
        for (
          let index = 0;
          index < response.videos.length && index < maxVideos;
          index++
        ) {
          const element = response.videos[index];
          try {
            let sData = {
              ...JSON.parse(default_service_data.data),
              keyword: element.title,
              playlist_url: element.video_id, // Changed from videoId to video_id
              suggest_channel_ids: data.suggest_channel_ids || "",
              channel_title: "", // Since we don't have channel title in response
              channel_username: "", // Since we don't have channel handle in response
            };

            let ser = {
              script_code: "watch_video",
              data: JSON.stringify(sData),
              note: "channel " + data.channel_id,
            };

            const rsService = await Service.create(ser);
          } catch (error) {
            console.log("error /add-videos-from-channel");
          }
        }
      }
    }

    res.send({ success: true });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

/*
 * Người viêt: Đinh Văn Thành
 * Ngày Viết: 20-04-2024
 * Chức Năng: tìm kiếm thông tin video của youtube
 * Method: GET
 * Tham số: Cliet truyền id của đoạn video sang cho serer
 * Ví Dụ: https://www.youtube.com/watch?v=PBUlu2SfziU =>  PBUlu2SfziU là mã của video cần lấy để truyền vào tham số id
 */
router.get("/search-video", async function (req, res) {
  return new Promise(async (resolve, reject) => {
    let videoId = req.query.id;
    const videoInfo = await getVideoInfo(videoId);
    if (videoInfo) {
      res.send({ result: videoInfo });
    }
  });
});

router.put("/change-id", async (req, res) => {
  try {
    const Service = await getModel("Service");
    const serviceId = req.body._id;
    // Tìm service theo ID và script_code
    const service = await Service.findOne({
      _id: serviceId,
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Tìm service có id cao nhất
    const maxIdService = await Service.findOne(
      {},
      { id: 1, _id: 0 },
      { sort: { id: -1 } }
    );
    let newID = 1;

    if (maxIdService) {
      newID = maxIdService.id + 1;
    }

    // Gán ID mới cho service
    service.id = newID;

    // Lưu service đã được cập nhật
    await service.save();

    // Lưu lại id vào getModel("ID")
    let ID = getModel("ID");
    await ID.findOneAndUpdate(
      { name: "Service" },
      { $set: { counter: newID } },
      { upsert: true, new: true }
    );

    res.json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Tính toán và chạy lại đơn cho những đơn bị lỗi
router.put("/load-data-btn", async function (req, res) {
  try {
    let _id = req.body._id;
    let ServiceModel = await getModel(modelName);
    let currentService = await ServiceModel.findOne({ _id: _id });

    if (currentService) {
      const data = JSON.parse(currentService.data);
      let channeIdSearch = "";
      if (data.channel_id.includes("@")) {
        channeIdSearch = await getChannelID(data.channel_id);
        data.channel_id = channeIdSearch;
        currentService.channel_id = `channel/${channeIdSearch}`;
      } else {
        channeIdSearch = data.channel_id
          .replace("channel/", "")
          .replace(/\/$/, "");
      }

      let rs = await videoNamesFromChannelID(channeIdSearch);
      if (rs && rs.names && Array(rs.names) && rs.names.length) {
        currentService.names = rs.names;
      }
      if (rs.channelTitle) {
        currentService.channel_title = rs.channelTitle;
      }

      const dataSub = await getModel("Order").getCurrentValue(
        currentService.script_code,
        currentService
      );
      currentValue = dataSub?.subscriberCount;
      currentService.data = JSON.stringify(data);

      if (currentValue || currentValue == 0) {
        currentService.fisrt_value_log = currentValue;
        currentService.first_data_reported_watch_new =
          currentService.remaining + currentValue;
        currentService.first_data_reported = currentValue;
        currentService.status = "";
        currentService.is_stop = false;

        currentService.note = `${currentValue} + ${
          currentService.fisrt_remaining
        } = ${Number(currentValue) + Number(currentService.fisrt_remaining)}`;
      } else {
        currentService.status = "error";
        currentService.is_stop = true;
      }

      await currentService.save();
    } else {
      console.log("Service not found");
    }
    res.send({ success: true });
  } catch (e) {
    console.log("eee", e);
    res.send({ err: e });
  }
});

router.get("/export-all-service", async (req, res) => {
  try {
    const Service = getModel("Service");
    const services = await Service.find({});
    const jsonContent = JSON.stringify(services, null, 2);

    // Write to a file
    fs.writeFileSync("services_export.json", jsonContent);

    res.download("services_export.json", (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading file");
      }
      // Delete the file after download
      fs.unlinkSync("services_export.json");
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).send("Error exporting data");
  }
});

router.post(
  "/import-services",
  express.json({ limit: "50mb" }),
  async (req, res) => {
    try {
      const Service = getModel("Service");
      const importData = req.body;

      if (!Array.isArray(importData)) {
        return res
          .status(400)
          .send("Invalid import data format. Expected an array.");
      }

      // Clear existing data (optional)
      await Service.deleteMany({});

      // Insert new data
      const result = await Service.insertMany(importData);

      res.status(200).json({
        message: "Import successful",
        insertedCount: result.length,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).send("Error importing data");
    }
  }
);

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

/**
 * Tạo playlist từ channel
 */
router.post(
  "/create-playlist-from-channel",
  apiLimiter,
  async function (req, res) {
    try {
      let { keyword, tags, pllDescription, limit, suggest_channel } = req.body;
      if (!keyword) {
        return res.status(400).send({ error: "Channel ID is required" });
      }

      if (keyword.includes("@"))
        keyword = "channel/" + (await getChannelID(keyword));

      if (suggest_channel.includes("@"))
        suggest_channel = "channel/" + (await getChannelID(suggest_channel));

      let Playlist = getModel("Playlist");
      let videoTitles = await getVideoTitlesFromChannel({
        channelId: keyword.replace(/^channel\//, ""),
        limit: limit,
      });

      console.log("videoTitles", videoTitles.length, limit);

      let dess = (pllDescription || "").split("#");

      const playlistPromises = videoTitles.map(async (videoTitle) => {
        let randomPos = Math.floor(Math.random() * dess.length);
        let pllDes = dess[randomPos];
        return Playlist.loadCreatePlaylistServices({
          keyword: videoTitle,
          tags: tags || "",
          suggest_channel: suggest_channel || "",
          pll_description: pllDes || "",
        });
      });

      await Promise.all(playlistPromises);

      await youtubeService.addChannelToWatchlist({
        keyword,
        tags,
        pllDescription,
        suggest_channel,
      });

      res.send({ success: true });
    } catch (e) {
      console.error("Error in create-playlist-from-channel:");
      res
        .status(200)
        .send({ error: "An error occurred while processing your request" });
    }
  }
);

router.post("/manual-check", youtubeController.manualCheck);

/**
 * Đánh dấu một service đã hoàn hành
 */

router.post("/complete", async function (req, res) {
  try {
    const serviceId = req.body.id;

    console.log("complate", serviceId);

    if (!serviceId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing service ID" });
    }

    const ServiceModel = getModel("Service");
    const updatedService = await ServiceModel.findOneAndUpdate(
      { _id: serviceId },
      { $set: { remaining: 0, status: "completed" } },
      { new: true }
    );

    if (!updatedService) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }
    await updateOrderStatus(updatedService?.order_id, "completed");
    res.json({
      success: true,
      message: "Service marked as completed",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error in /complete/:id:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// router.post("/check-and-complete-youtube-sub", async function (req, res) {
//   try {
//     const result = await checkAndCompleteYouTubeServices();
//     res.json(result);
//   } catch (error) {
//     console.error("Error in /check-and-complete-youtube-sub:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });

router.post("/:id", async function (req, res) {
  try {
    const serviceId = req.params.id;
    if (!serviceId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing service ID" });
    }

    const currentService = await getModel("Service").findOne({
      _id: serviceId,
    });
    if (!currentService) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const script_code = currentService.script_code;
    const script = await getModel("Script").findOne(
      { code: script_code },
      "logsSubMissing"
    );

    const logsSubMissing = script?.logsSubMissing || {};
    const updateData = { ...req.body, is_stop: req.body.is_stop };
    if (script_code === "youtube_sub") {
      const { fisrt_remaining, fisrt_value_log, is_stop, first_data_reported } =
        currentService;
      const data = JSON.parse(currentService.data);
      const channelId = data.channel_id.replace("channel/", "");
      const channelInfo = await getChannelInfo(channelId);
      if (channelInfo.error) {
        throw new Error("Failed to fetch channel information");
      }

      const currentSub = Number(channelInfo.subscriberCount);
      const targetValue = fisrt_remaining + Number(fisrt_value_log);
      const subMissing = targetValue - currentSub;
      const logCode = getLogCode("Asia/Ho_Chi_Minh", "HH/DD/MM");

      updateData.partial_refund = subMissing;
      // Trường hợp dừng đơn
      if (!is_stop && req.body.is_stop) {
        if (subMissing > 0) {
          logsSubMissing[logCode] = (logsSubMissing[logCode] || 0) + subMissing;
          await script.updateOne({ logsSubMissing });
        } else if (subMissing <= 0) {
          await getModel("Service").updateOne(
            { _id: serviceId },
            { remaining: 0 }
          );
          updateData.partial_refund = 0;
          await updateOrderStatus(currentService?.order_id, "completed");
        }
        // Trường hợp chạy lại đơn bị dừng
      } else if (is_stop && !req.body.is_stop) {
        if (subMissing > 0) {
          logsSubMissing[logCode] = (logsSubMissing[logCode] || 0) - subMissing;
          await script.updateOne({ logsSubMissing });
          updateData.partial_refund = 0;
        } else if (subMissing <= 0) {
          await getModel("Service").updateOne(
            { _id: serviceId },
            { remaining: 0 }
          );
          updateData.partial_refund = 0;
        }
      }
    }

    await getModel("Service").updateOne({ _id: serviceId }, updateData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error in /:id: 2321");
    return res
      .status(500)
      .json({ success: false, message: "Internal server error " });
  }
});

module.exports = router;

module.exports = express.Router().use(router);
