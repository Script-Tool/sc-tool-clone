const mongoose = require("mongoose");
const {
  videoNamesFromChannelID,
} = require("../src/services/youtube-api/videoNamesFromChannelID");
const getChannelID = require("../src/services/rapidapi-api/getChannelID");
let Schema = mongoose.Schema;
let Service = new Schema(
  {
    id: Number,
    script_code: String,
    count: { type: String, default: 0 },
    data: String,
    remaining: { type: Number, default: -1 },
    fisrt_remaining: Number,
    executed: { type: Number, default: 0 },
    one_time: { type: Boolean },
    start_max_time: { type: Number, default: 0 },
    end_max_time: { type: Number, default: 0 },
    last_report_time: { type: Date },
    fisrt_value_log: String,
    note: String,
    note2: String,
    data_reported: String,
    first_data_reported: String,
    customer: Number,
    is_system: Boolean,
    order_id: String,
    is_stop: { type: Boolean, default: false },
    status: String,
    no_warranty: { type: Boolean, default: false },
    names: { type: Array },
    channel_title: String,
    channel_id: String,
    partner_id: String,
    total_remaining: Number,
    current_sub: Number,
    last_remaining_sub: Number,
    partial_refund: Number,
    first_data_reported_watch_new: { type: Number }, // số lần view khách hang mong muốn
    total_remaining_new: { type: Number }, // lấy số lần thay đổi của remaining khi người dùng chỉnh sửa hoặc thêm lượt chạy mới
    retries: { type: Number, default: 10 },
  },
  { strict: false }
);

Service.set("timestamps", true);

Service.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    let ID = getModel("ID");
    let newID = await ID.next("Service");
    this.id = newID;

    if (["youtube_sub"].includes(this.script_code) && !this.is_from_import) {
      try {
        let data = JSON.parse(this.data);
        let channelID = data.channel_id || "";
        let maxVideo = data.number_of_videos || 10;

        // Lấy thông tin channel
        if (channelID && channelID.includes("@")) {
          let newChannelID = await getChannelID(channelID);
          if (newChannelID) {
            data.channel_user_name = data.channel_id;
            data.channel_id = "channel/" + newChannelID;
            this.channel_id = newChannelID;
            channelID = newChannelID;
            this.data = JSON.stringify(data);
          }
        }
        channelID = channelID.replace("channel/", "");
        this.channel_id = channelID;

        if (["youtube_sub"].includes(this.script_code)) {
          const { names = [], channelTitle = "" } =
            await videoNamesFromChannelID(channelID, maxVideo);
          this.names = names;
          this.channel_title = channelTitle;
        }

        if (["comment_youtube"].includes(this.script_code) && !data.video_id) {
          const { names = [], channelTitle = "" } =
            await videoNamesFromChannelID(channelID, maxVideo);
          this.names = names;
          this.channel_title = channelTitle;
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (["create_audio_1"].includes(this.script_code)) {
      this.retries = 20;
    }

    if (
      !this.disable_log &&
      this.remaining > 0 &&
      [
        "youtube_sub",
        "like_youtube",
        "comment_youtube",
        "watch_video",
        "like_fb_page",
        "folow_fb",
      ].includes(this.script_code)
    ) {
      const script = await getModel("Script").findOne(
        { code: this.script_code },
        "logs"
      );
      let logs = script && script.logs;
      if (!logs) {
        logs = {};
      }

      let date = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
      );
      let month = date.getMonth();
      month += 1;
      if (month > 12) {
        month = 1;
      }
      let logCode = `${date.getHours()}/${date.getDate()}/${month}`;
      if (this.start_max_time) {
        logCode += "-delay";
      }

      if (!logs[logCode]) {
        logs[logCode] = this.remaining;
      } else {
        logs[logCode] += this.remaining;
      }

      await script.updateOne({ logs });
    }

    if (this.remaining > 0) {
      this.total_remaining = this.remaining;
      let addPercent = 35;
      if (
        [
          "like_fb_page",
          "folow_fb",
          "like_youtube",
          "comment_youtube",
          "youtube_sub",
        ].includes(this.script_code)
      ) {
        addPercent = 10;
      }

      this.fisrt_remaining = this.remaining;
      let currentValue = "";
      if (
        ["youtube_sub", "folow_fb", "fb_add_member"].includes(this.script_code)
      ) {
        //load pre sub
        let data = JSON.parse(this.data);
        try {
          const dataSub = await getModel("Order").getCurrentValue(
            this.script_code,
            data
          );
          currentValue = dataSub?.subscriberCount;
          data.channel_user_name = dataSub?.channel_user_name;
          this.data = JSON.stringify(data);
        } catch (error) {
          console.log("error", error);
        }

        this.remaining = Math.floor(this.remaining * (1 + addPercent / 100));

        if (currentValue || currentValue == 0) {
          this.fisrt_value_log = currentValue;
          this.first_data_reported_watch_new = this.remaining + currentValue;
          this.first_data_reported = currentValue;
        } else {
          this.status = "error";
          this.is_stop = true;
        }
      } else if (
        ["like_youtube", "comment_youtube"].includes(this.script_code)
      ) {
        const data = JSON.parse(this.data);
        this.remaining = Math.floor(this.remaining * (1 + addPercent / 100));

        if ("like_youtube" == this.script_code) {
          currentValue = Number(data?.statistics?.likeCount);
        } else {
          currentValue = Number(data?.statistics?.commentCount);
        }

        this.fisrt_value_log = currentValue;
        this.first_data_reported_watch_new = this.remaining + currentValue;
        this.first_data_reported = currentValue;
      }
      this.note = `${currentValue} + ${this.fisrt_remaining} = ${
        Number(currentValue) + Number(this.fisrt_remaining)
      }`;
    }
  }

  next();
});

Service.post(/updateOne/, async function () {
  if (
    this.remaining == -1 &&
    ["like_fb_page", "folow_fb"].includes(this.script_code)
  ) {
    await getModel("Service").updateOne({ id: this.id }, { remaining: 0 });
  }
});

Service.statics.getFilter = function (req) {
  let filter = {
    script_code: req.query.code,
  };

  if (req.query.created_day) {
    let day = 86400000 * Number(req.query.created_day);
    filter.createdAt = {
      $lt: new Date(Date.now() - day),
    };
  }

  if (req.query.data_reported) {
    filter.data_reported = { $regex: req.query.data_reported };
  }

  if (req.query.serviceNote) {
    filter.note = { $regex: req.query.serviceNote };
  }

  if (req.query.serviceData) {
    filter.data = { $regex: req.query.serviceData };
  }

  if (req.query.serviceId) {
    filter.id = Number(req.query.serviceId);
  }

  if (req.query.serviceOrderID) {
    filter.order_id = req.query.serviceOrderID;
  }

  if (req.query.executedValue) {
    if (req.query.executedValue == "0") {
      filter["remaining"] = Number(req.query.executedValue);
    } else {
      filter["remaining"] = {
        [req.query.executedOperator]: Number(req.query.executedValue),
      };
    }
  }

  if (req.query.serviceStatus) {
    if (req.query.serviceStatus == "stopped") {
      filter["is_stop"] = true;
    } else if (req.query.serviceStatus == "running" && !filter["remaining"]) {
      filter["remaining"] = { $gt: 1 };
      filter["is_stop"] = { $ne: true };
    } else if (req.query.serviceStatus == "-1") {
      filter["remaining"] = -1;
    } else if (req.query.serviceStatus == "0" && !filter["remaining"]) {
      filter["remaining"] = { $in: [0] };
    } else if (req.query.serviceStatus == "baohanh") {
      filter["status"] = "baohanh";
    } else if (req.query.serviceStatus == "loibaohanh") {
      filter["status"] = "loibaohanh";
    } else if (req.query.serviceStatus == "hoantat") {
      filter["status"] = "hoantat";
    } else if (req.query.serviceStatus == "waiting_for_handle") {
      filter["remaining"] = { $in: [1] };
    } else if (req.query.serviceStatus == "error") {
      filter["status"] = "error";
    }
  }

  if (req.query.start_max_time) {
    filter.start_max_time = req.query.start_max_time;
  }

  if (req.query.names) {
    filter.names = +req.query.names
      ? { $exists: true, $ne: [] }
      : { $exists: true, $size: 0 };
  }

  return filter;
};

Service.statics.loadDefaultConfig = async function (services) {
  if (!Array.isArray(services)) {
    services = [services];
  }

  let Script = await getModel("Script");
  for await (let service of services) {
    let script = await Script.findOne(
      { code: service.script_code },
      "default_service_data"
    );

    let serviceCustomData = JSON.parse(service.data);
    let defaultServiceData = {};
    if (script.default_service_data) {
      if (script.default_service_data.data) {
        script.default_service_data.data =
          script.default_service_data.data.replace(/\n/g, "");
        defaultServiceData = JSON.parse(script.default_service_data.data);

        Object.keys(serviceCustomData).forEach((key) => {
          if (!serviceCustomData[key] && defaultServiceData[key]) {
            serviceCustomData[key] = defaultServiceData[key];
          }
        });
        service.data = JSON.stringify(serviceCustomData, null, "\t");
      }

      if (
        !service.start_max_time &&
        script.default_service_data.start_max_time
      ) {
        service.start_max_time = script.default_service_data.start_max_time;
      }

      if (!service.end_max_time && script.default_service_data.end_max_time) {
        service.end_max_time = script.default_service_data.end_max_time;
      }
    }
  }
  return services;
};

Service.methods.handleData = async function (
  script = {},
  vmName = "",
  info = {}
) {
  try {
    let data = JSON.parse(this.data);
    data.script_code = this.script_code;
    data._id = this._id;
    data.is_break = script.is_break;

    if (["youtube_sub", "comment_youtube"].includes(data.script_code)) {
      if (this.names && this.names.length) {
        data.video_name =
          this.names[Math.floor(Math.random() * this.names.length)];
        let dataVid = data.video_name.split("#VID");
        if ("comment_youtube" == data.script_code) {
          data.video_id = dataVid[1];
        } else {
          data.video_name = dataVid[0];
          data.playlist_url = dataVid[1];
          data.sub_from_search_video = true;
          data.video_name = data.video_name.replace(
            "#VID" + data.playlist_url,
            ""
          );
          if (this.channel_title) {
            data.channel_title = this.channel_title;
          }
          if (this.channel_id) {
            data.channel_id = this.channel_id;
          }
        }
      }
    } else if (
      data.script_code == "watch" ||
      data.script_code == "watch_video"
    ) {
      data.playlist_percent = 100;
      data.url_type = data.script_code == "watch_video" ? "video" : "playlist";
      data.total_times = data.total_times || 1; //getRndInteger(35, 50)
      data.playlist_index = data.total_times;

      if (data.script_code == "watch_video") {
        data["suggest_percent"] = Number(data.suggest_percent) || 0;
        data["page_watch"] = Number(data.page_percent) || 0;
        data["direct_percent"] = Number(data.direct_percent) || 0;
        data["search_percent"] = Number(data.search_percent) || 0;

        if (
          data.sub_percent &&
          Math.random() < Number(data.sub_percent) / 100
        ) {
          data.is_sub = true;
        }
        if (
          data.like_percent &&
          Math.random() < Number(data.like_percent) / 100
        ) {
          data.is_like = true;
        }
        if (
          data.comment_percent &&
          Math.random() < Number(data.comment_percent) / 100
        ) {
          data.is_comment = true;
          let Comment = getModel("Comment");
          data.comment = await Comment.getRandomComment();
        }
      }
    } else if (data.script_code == "post_fb") {
      let { fb_topic_code, group_link } = data;
      if (!group_link) {
        let filter = fb_topic_code ? { set_code: fb_topic_code } : {};
        if (info.partner_id) {
          filter.partner_id = info.partner_id;
        }
        let countRs = await getModel("FBContent").find(filter).countDocuments();
        let randomPosition = Math.floor(Math.random() * countRs);
        let content = await getModel("FBContent")
          .findOne(filter)
          .skip(randomPosition);
        if (content) {
          data.content = content.content;
        }

        countRs = await getModel("FBGroup").find(filter).countDocuments();
        randomPosition = Math.floor(Math.random() * countRs);
        let group = await getModel("FBGroup")
          .findOne({ ...filter, status: true })
          .skip(randomPosition);
        if (group) {
          data.group_link = group.link;
        }
      }
    } else if (data.script_code == "add_recovery_mail") {
      const ProfileModel = getModel("Profile");
      let profileEx = await ProfileModel.findOne(
        { id: info.pid },
        "id password description verified recover_mail"
      );
      if (!profileEx || profileEx.verified) {
        return false;
      }

      if (profileEx) {
        data.password = profileEx.password;
      }

      let query = { used_for_recovery: { $nin: [1, 2] }, status: "TRASH" };
      let countRs = await ProfileModel.find(query).countDocuments();
      let randomPosition = Math.floor(Math.random() * countRs);
      let profile = await ProfileModel.findOne(
        query,
        "id password description used_for_recovery email"
      ).skip(randomPosition);

      if (profile) {
        data.recovery_mail = profile.email;
        data.get_otp_pid = profile.id;
        await profile.updateOne({ used_for_recovery: 1 });
      } else {
        return false;
      }
    } else if (data.script_code == "get_otp") {
      let profile = await getModel("Profile").findOne(
        { id: Number(info.pid) },
        "id description used_for_recovery"
      );

      if (profile && !profile.used_for_recovery) {
        if (!ready_recovery_mail.includes(profile.id)) {
          ready_recovery_mail.push(profile.id);
        }
      } else {
        return false;
      }
    } else if (data.script_code == "check_recovery") {
      let profile = await getModel("Profile").findOne(
        { id: Number(info.pid) },
        "id description"
      );

      if (
        profile &&
        ![
          "check_recovery_success",
          "check_recovery_failed",
          "check_recovery_success_need_very",
        ].includes(profile.description)
      ) {
        //
      } else {
        ignoreProfiles.push(info.pid);
        return false;
      }
    } else if (data.script_code == "spam_fb_account") {
      let filter = data?.fb_topic_code ? { set_code: data.fb_topic_code } : {};
      let countRs = await getModel("FBProfile").find(filter).countDocuments();
      let randomPosition = Math.floor(Math.random() * countRs);
      let profile = await getModel("FBProfile")
        .findOne({ ...filter })
        .skip(randomPosition);
      if (profile) {
        data.fb_id = profile.fb_id;
      }
    } else if (data.script_code == "fb_create_story") {
      let filter = data?.fb_topic_code ? { set_code: data.fb_topic_code } : {};
      let countRs = await getModel("FBContent").find(filter).countDocuments();
      let randomPosition = Math.floor(Math.random() * countRs);
      let content = await getModel("FBContent")
        .findOne(filter)
        .skip(randomPosition);
      if (content) {
        data.content = content.content;
      }
    } else if (
      data.script_code == "fb_comment_group" ||
      data.script_code == "fb_add_friend"
    ) {
      /**
       * comment vào groupt fb
       * Tìm kiếm theo fb_topic_code
       */
      let { fb_topic_code = "", link = "", get_from_profile } = data;
      if (!link) {
        let filter = fb_topic_code ? { set_code: fb_topic_code } : {};
        if (get_from_profile) {
          let countRs = await getModel("FBProfile")
            .find(filter)
            .countDocuments();
          let randomPosition = Math.floor(Math.random() * countRs);
          let profile = await getModel("FBProfile")
            .findOne(filter)
            .skip(randomPosition);

          if (profile) {
            data.fb_id = profile.fb_id;
          }
        } else {
          let countRs = await getModel("FBGroup").find(filter).countDocuments();
          let randomPosition = Math.floor(Math.random() * countRs);
          let group = await getModel("FBGroup")
            .findOne(filter)
            .skip(randomPosition);
          if (group) {
            data.group_link = group.link;
          }
        }
      }
    }

    // handle comment
    if (!isNaN(data.comment) || !data.comment) {
      let Comment = getModel("Comment");
      if (data.script_code == "comment_youtube") {
        data.comment = await Comment.getRandomComment(
          "youtube",
          this.id,
          info.partner_id
        );
        if (!data.comment) {
          data.comment = await Comment.getRandomComment(
            "youtube",
            null,
            info.partner_id
          );
        }
      } else if (data.script_code.indexOf("youtube") > -1) {
        data.comment = await Comment.getRandomComment(
          "youtube",
          null,
          info.partner_id
        );
      } else if (data.script_code.indexOf("map") > -1) {
        data.comment = await Comment.getRandomComment("map");
      } else if (data.script_code == "comment_fb_post") {
        data.comment = await Comment.getRandomComment(
          "facebook",
          null,
          info.partner_id
        );
        if (data.comment) {
          if (data.is_random_image) {
            data.comment += " +image";
          }
        }
      } else if (data.script_code == "tiktok_comment") {
        data.comment = await Comment.getRandomComment(
          "tiktok",
          null,
          info.partner_id
        );
      } else {
        data.comment = await Comment.getRandomComment();
      }
    }

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

Service.statics.addServiceFromPackageData = async function (
  order,
  customer_values = {}
) {
  let customerData = "{}";
  try {
    customerData = JSON.stringify(customer_values);
  } catch (error) {}

  let note = "order-" + order.id;
  if (order.package.is_gift) {
    note += "-gift";
  }
  if (order.package.is_custom && !order.package.is_custom_value) {
    note += "-custom";
  }

  let serviceData = {
    script_code: order.package.script_code,
    remaining: order.package.value,
    data: customerData,
    note: note,
    order_id: order.id,
  };

  if (order.customer_name) {
    serviceData.note2 = order.customer_name;
  }

  if (order.group_name) {
    serviceData.note += `-${order.group_name}`;
  }

  if (order.fisrt_value_log) {
    let targetValue = Number(order.fisrt_value_log) + order.package.value;
    serviceData.first_data_reported = `${order.fisrt_value_log}+${order.package.value}=${targetValue}`;
  }

  if (order.package.script_code == "youtube_sub" && serviceData.remaining) {
    serviceData.remaining += (serviceData.remaining * 15) / 100;
    serviceData.remaining = Math.floor(serviceData.remaining);
  }

  const ScriptModel = getModel("Script");
  let script = await ScriptModel.findOne(
    { code: order.package.script_code },
    "default_service_data"
  );

  if (script && script.default_service_data.start_max_time) {
    serviceData.start_max_time = script.default_service_data.start_max_time;
    serviceData.end_max_time = script.default_service_data.end_max_time;
  }

  if (
    script &&
    script.default_service_data &&
    script.default_service_data.data
  ) {
    try {
      try {
        let defaultData = JSON.parse(script.default_service_data.data);
        let customerData = JSON.parse(serviceData.data);
        customerData = { ...defaultData, ...customerData };

        serviceData.data = JSON.stringify(customerData);
      } catch (error) {
        console.log(error);
      }
    } catch (error) {}
  }

  let service = await this.create(serviceData);
  return service;
};

Service.statics.getRandomDirectLinkService = async function () {
  const randomService = await this.findOne({ script_code: "direct_link" })
    .skip(
      Math.floor(
        Math.random() *
          (await this.countDocuments({ script_code: "direct_link" }))
      )
    )
    .exec();

  return randomService;
};
// Chỉ mục kết hợp chính cho query thường xuyên nhất
Service.index({
  script_code: 1,
  is_stop: 1,
  start_max_time: 1,
  last_report_time: 1,
  remaining: 1,
});

// Chỉ mục cho các truy vấn theo order và status
Service.index({ order_id: 1 });
Service.index({ status: 1 });

// Chỉ mục text cho tìm kiếm
Service.index({ data: "text" });

// Chỉ mục timestamps
Service.index({ createdAt: 1 });
Service.index({ updatedAt: 1 });

module.exports = Service;
