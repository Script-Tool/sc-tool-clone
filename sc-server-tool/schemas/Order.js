const mongoose = require("mongoose");
const fetch = require("node-fetch");
const axios = require("axios");
let Schema = mongoose.Schema;
const rootApi = require("../modules/root-api-request");
const {
  getChannelInfo,
} = require("../src/services/youtube-api/getChannelInfo");
const { getVideoInfo } = require("../src/services/youtube-api/getVideoInfo");

let OrderSchema = new Schema(
  {
    id: Number,
    script_code: String,
    package: Object,
    customer: Number,
    paid: { type: Number, default: 0 },
    payment_term: Date,
    status: { type: String, default: "wait_to_run" }, // running, complete, wait_to_run, error, cancelled
    paid_in_full: { type: Boolean, default: false },
    customer_values: Object,
    order_result: String,
    fisrt_value_log: String,
    group_name: String,
    customer_name: String,
  },
  { strict: false }
);

OrderSchema.set("timestamps", true);

OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    let ID = await getModel("ID");
    let newID = await ID.next("Order");
    this.id = newID;
  }

  if (this.package.price <= this.paid) {
    this.paid_in_full = true;
  }

  next();
});

OrderSchema.statics.getCurrentValue = async function (
  script_code,
  customer_values
) {
  /*
   * Người Viết: Đinh Văn Thành
   * Ngày Viết 22-04-2024
   * Chức Năng: Thay đỏi toàn bộ api https://www.googleapis.com/youtube/v3/videos thành một api mới
   */
  if (script_code == "comment_youtube") {
    if (customer_values.video_id) {
      const data = await getVideoInfo(customer_values.video_id);
      if (data) {
        return parseInt(data.statistics.commentCount);
      }
    }
  } else if (script_code == "like_youtube") {
    if (customer_values.video_id) {
      const data = await getVideoInfo(customer_values.video_id);
      if (data) {
        return parseInt(data.statistics.likeCount);
      } else {
        console.error("Không tìm thông tin video");
      }
    }
  } else if (script_code == "youtube_sub") {
    async function execGetSub() {
      let channelId = customer_values.channel_id;
      if (channelId) {
        if (channelId.startsWith("channel/")) {
          channelId = channelId.replace("channel/", "");
        } else if (channelId.startsWith("user/")) {
          channelId = channelId.replace("user/", "");
        } else if (channelId.startsWith("c/")) {
          console.log(`channelId.startsWith("c/"`);
        }

        const data = await getChannelInfo(channelId);
        if (data) {
          return data;
        }
        return null;
        console.error("Không tìm thông tin video");
      }
    }
    return await execGetSub();
  } else if (script_code == "watch_video") {
    if (customer_values.playlist_url) {
      const data = await getChannelInfo(customer_values.playlist_url);
      if (data) {
        return data;
      }
    }
  }
  //============= END =========================
  else if (script_code == "folow_fb") {
    if (customer_values.link) {
      let url = `https://proytb.info/checkstartcount.php?link=${customer_values.link}`;
      const rs = await fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            return data;
          }
          return null;
        })
        .catch((err) => {
          console.log("Error while get folow_fb on api", err);
          return null;
        });

      if (rs && rs.total_count) {
        return Number(rs.total_count);
      } else {
        throw Error(
          "Không tìm thấy link, vui lòng kiểm tra lại ID link :" +
            customer_values.link
        );
      }
    }
  } else if (script_code == "fb_add_member") {
    if (customer_values.link) {
      let url = `https://proytb.info/checkstartcountgroup.php?link=${customer_values.link}`;
      const rs = await fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            return data;
          }
          return null;
        })
        .catch((err) => {
          console.log("Error while get checkstartcountgroup on api", err);
          return null;
        });

      if (rs && rs.total_count) {
        return Number(rs.total_count);
      } else {
        throw Error(
          "Không tìm thấy link, vui lòng kiểm tra lại ID link :" +
            customer_values.link
        );
      }
    }
  } else if (script_code == "like_fb_page") {
    if (customer_values.page_link) {
      let fbAPIKey = await getModel("APIKey").getRandomKey("facebook_api");
      const accessToken =
        fbAPIKey ||
        "EAABwzLixnjYBAGLY10Rn7ujZCYUlYB3N6HdjNU6Uontwr2mueqIiGtqhWo4YN0bj24ZANIZCuhIsJOuE6r25BxgURV5fbsyvO0Q3NYrcD5THwkGdjTB3F0wudalNo6fmflN1cACnftUZCOsmAUtF0Eve22B0ccMcnCanZCZCNs2SJ0QJiKAgiZC";
      let uid = customer_values.page_link;
      uid = uid.replace("https://www.facebook.com/profile.php?id=", "");
      let link = `https://graph.facebook.com/v13.0/https://www.facebook.com/${uid}?fields=fan_count&access_token=${accessToken}`;
      const rs = await fetch(link)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            return data;
          }
          return null;
        })
        .catch((err) => {
          console.log("Error while get folow_fb on api", err);
          return null;
        });
      if (rs && rs.fan_count) {
        return Number(rs.fan_count);
      } else {
        throw Error("Không the lay fan count:" + customer_values.page_link);
      }
    }
  }
};

OrderSchema.methods.cancelAndRefund = async function () {
  const Order = getModel("Order");
  let order = this;
  if (order && order.fisrt_value_log) {
    if (!order.is_custom || order.is_custom_value) {
      const rs = await rootApi.request({
        url: "/service/delete",
        method: "POST",
        data: {
          service_id: order.order_result,
        },
      });

      if (rs.data && rs.data.success) {
        const CustomerModel = getModel("Customer");
        let customer = await CustomerModel.findOne({ id: order.customer });

        if (customer) {
          const WalletModel = getModel("Wallet");
          let wallet = await WalletModel.findOne({ customer: customer._id });
          if (wallet) {
            const fisrt_value_log = order.fisrt_value_log;
            const targetValue = Number(fisrt_value_log) + order.package.value;
            const currentValue = await Order.getCurrentValue(
              order.package.script_code,
              order.customer_values
            );
            const missingValue = targetValue - currentValue;

            let total_refund = Math.floor(
              missingValue * (order.package.price / order.package.value)
            );
            if (total_refund) {
              if (total_refund > order.package.price) {
                return { success: false, message: "Invalid price." };
              }
              await wallet.updateOne({ $inc: { balance: total_refund } });
            }
            await order.updateOne({ status: "cancelled" });
            return { success: true, status: "success", message: "Hoàn tất." };
          } else {
            return {
              success: false,
              status: "error",
              message: "Not found wallet",
            };
          }
        } else {
          return {
            success: false,
            status: "error",
            message: "Not found customer",
          };
        }
      }
    } else {
      return {
        success: false,
        status: "error",
        message: "Loại dịch vụ này tạm thời chưa thể hủy.",
      };
    }
  }
};

OrderSchema.methods.processFirstValue = async function () {
  let value = await getModel("Order").getCurrentValue(
    this.package.script_code,
    this.customer_values
  );
  if (value) {
    this.fisrt_value_log = value;
  }
};

OrderSchema.statics.formatChannelId = function (channelId) {
  channelId = channelId.replace("\t", "");
  channelId = channelId.replace("https://studio.youtube.com/", "");
  channelId = channelId.replace("http://www.youtube.com/", "");
  channelId = channelId.replace("https://www.youtube.com/", "");
  channelId = channelId.replace("https://youtube.com/", "");
  channelId = channelId.replace("youtube.com/", "");
  channelId = channelId.replace("/videos", "");
  channelId = channelId.replace("https://m.", "");

  if (channelId.endsWith("/")) {
    channelId = channelId.slice(0, channelId.length - 1);
  }

  return channelId;
};

OrderSchema.statics.formatVideoID = function (videoID) {
  videoID = videoID.replace("youtube.com/watch?v=", "");
  videoID = videoID.replace("https://www.youtube.com/watch?v=", "");
  videoID = videoID.replace("https://m.youtube.com/watch?v=", "");
  videoID = videoID.replace("v=", "");

  if (videoID.endsWith("/")) {
    videoID = videoID.slice(0, videoID.length - 1);
  }

  return videoID;
};

OrderSchema.statics.isExistVideoID = async function (videoID, orderID = null) {
  let qr = {
    $or: [
      { "customer_values.playlist_url": videoID },
      { "customer_values.videos_ids": { $regex: videoID } },
    ],
    "package.is_gift": { $ne: true },
  };

  if (orderID) {
    qr.id = { $ne: orderID };
  }

  let exist = await this.findOne(qr);

  if (exist) {
    return {
      status: "error",
      message:
        "Kênh này đã được chạy trước đó, không thể chạy 2 lần trên 1 kênh. Video ID: " +
        videoID,
    };
  }
  return false;
};

OrderSchema.statics.isExistChannel = async function (channelId) {
  let rs = await rootApi.request({
    url: "/service/check-channel-id-exist",
    method: "post",
    data: {
      channelID: channelId,
    },
  });

  if (rs.data.success && rs.data.exist) {
    return {
      status: "error",
      message:
        "Kênh này chưa hoàn tất trên hệ thống, vui lòng thử kênh khác. Channel ID: " +
        channelId,
    };
  }

  return false;
};

module.exports = OrderSchema;
