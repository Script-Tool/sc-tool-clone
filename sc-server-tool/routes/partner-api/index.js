const express = require("express");
const router = express.Router();
const axios = require("axios");
const { getChannelInfo } = require("../../src/services/youtube-api/getChannelInfo");
const { getLogCode } = require("../../src/utils/getLogCode");
const { sleep } = require("../../src/utils/utils");
const extractUsernameOrChannelId = require("../../src/utils/extractUsernameOrChannelId");

// Cập nhập trạng thái service và
router.post("/service/status", async function (req, res) {
  try {
    const svID = req.body.id;

    if (!svID) {
      return res
        .status(400)
        .json({ success: false, message: "Missing service ID" });
    }

    const currentService = await getModel("Service").findOne({ id: svID });

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
    const responseData = { success: true };

    const {
      fisrt_remaining = 0,
      fisrt_value_log = "",
      _id,
      is_stop,
      partial_refund,
    } = currentService;
    responseData.fisrt_remaining = fisrt_remaining;
    responseData.fisrtValue = fisrt_value_log;

    // Khách chạy lại đơn nhưng đơn hiện tại đang chạy
    if (req.body.is_active && !is_stop) {
      responseData.message = "Service is running";
      return res.json({ ...responseData });
    } else if (!req.body.is_active && is_stop) {
      // Khách chạy dừng đơn nhưng đơn hiện tại đã bị dừng trước đó
      responseData.message = "Service has been temporarily stopped";
      responseData.partial_refund = partial_refund;
      return res.json({ ...responseData });
    }
    let serviceUpdate = {};

    if (script_code === "youtube_sub") {
      const data = JSON.parse(currentService.data);
      const channelId = data.channel_id.replace("channel/", "");
      const channelInfo = await getChannelInfo(channelId);

      if (channelInfo.error) {
        throw new Error("Failed to fetch channel information");
      }

      const currentSub = Number(channelInfo.subscriberCount);
      responseData.subscriberCount = currentSub;

      const targetValue = fisrt_remaining + Number(fisrt_value_log);
      const subMissing = targetValue - currentSub;
      serviceUpdate.partial_refund = subMissing;
      const logCode = getLogCode("Asia/Ho_Chi_Minh", "HH/DD/MM");

      // Khách hàng cancel đơn
      if (!is_stop && !req.body.is_active) {
        if (subMissing > 0) {
          logsSubMissing[logCode] = (logsSubMissing[logCode] || 0) + subMissing;
          responseData.partial_refund = subMissing;
          responseData.status = "stop_success";
          await script.updateOne({ logsSubMissing });
        } else if (subMissing <= 0) {
          responseData.partial_refund = 0;
          serviceUpdate.remaining = 0;
          responseData.status = "completed";
          serviceUpdate.partial_refund = 0;
          await getModel("Service").updateOne({ _id: _id }, { remaining: 0 });
        }
        // Khi khách chạy lại đơn bị cancel
      } else if (is_stop && req.body.is_active) {
        if (subMissing > 0) {
          logsSubMissing[logCode] = (logsSubMissing[logCode] || 0) - subMissing;
          responseData.subtotal = subMissing;
          responseData.status = "run_success";
          await script.updateOne({ logsSubMissing });
          serviceUpdate.partial_refund = 0;
        } else if (subMissing <= 0) {
          responseData.status = "completed";
          responseData.subtotal = 0;
          serviceUpdate.remaining = 0;
          serviceUpdate.partial_refund = 0;
        }
      }
    }

    await getModel("Service").updateOne(
      { id: svID },
      { ...serviceUpdate, is_stop: !req.body.is_active }
    );
    console.log("responseData", responseData);
    return res.json({ ...responseData });
  } catch (error) {
    console.error("Error in /service/status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * Lấy danh thông tin service
 */
router.get("/service/:id", async function (req, res) {
  let svID = req.params.id;

  if (svID) {
    let sv = await getModel("Service").findOne({ id: svID });
    if (sv) {
      let response = {
        success: true,
        id: sv.id,
        service_code: sv.script_code,
        remaining: sv.remaining,
        executed: sv.executed,
        first_data_reported: sv.first_data_reported,
        current_data_reported: sv.data_reported,
        note: sv.note,
        is_running: !sv.is_stop,
      };
      let status = sv.remaining == 0 ? "completed" : "is_running";
      if (sv.remaining == 0) {
        (status = "completed"),
          (response.message = "service has been completed");
      } else {
        status = "is_running";
        response.message = "service is running";
      }
      if (sv.is_stop) {
        status = "is_stop";
        response.partial_refund = sv.partial_refund;
        response.message =
          "The service has been stopped by an administrator or customer";
      } else if (sv.status == "baohanh" && sv.remaining > 0) {
        status = "under_warranty";
        response.message = "Service is under warranty";
      } else if (sv.status == "baohanh" && sv.remaining == 0) {
        status = "warranty_completed";
        response.message = "Warranty completed";
      }
      response.status = status;
      return res.json(response);
    }
  }

  res.json({ success: false, message: "Missing service ID" });
});

/**
 * Api bảo hành cho khách
 */
/**
 * @route POST /service/baohanh
 * @description API để bảo hành dịch vụ cho khách hàng
 * @access Public
 */
router.post("/service/baohanh", async function (req, res) {
  try {
    // Lấy serviceID từ body của request
    const { id: serviceID } = req.body;
    const Service = await getModel("Service");

    // Kiểm tra xem serviceID có tồn tại hay không
    if (!serviceID) {
      return res
        .status(400)
        .json({ success: false, message: "Missing service ID" });
    }

    // Tìm kiếm dịch vụ trong cơ sở dữ liệu dựa trên serviceID
    const service = await Service.findOne({ id: serviceID });

    // Kiểm tra xem dịch vụ có tồn tại hay không
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    // Lấy các thuộc tính cần thiết từ dịch vụ
    const { remaining: currentRemaining, is_stop, status } = service;

    // Kiểm tra xem dịch vụ có đang chạy hay không
    if (currentRemaining > 0) {
      if (status == "baohanh") {
        return res.status(400).json({
          success: false,
          message: "Service is running under warranty",
          status: "is_running",
        });
      }
      return res
        .status(400)
        .json({ success: false, message: "Service is running" });
    }

    // Kiểm tra xem dịch vụ có bị dừng bởi quản trị viên hoặc khách hàng hay không
    if (is_stop) {
      return res.status(400).json({
        success: false,
        message: "The service has been stopped by an administrator or customer",
      });
    }

    // Lấy dữ liệu từ dịch vụ và chuyển đổi từ chuỗi JSON thành đối tượng
    const data = JSON.parse(service.data);

    // Lấy giá trị hiện tại của dịch vụ
    const currentValue = await getCurrentValue(service.script_code, data);

    // Kiểm tra xem giá trị hiện tại có tồn tại hay không
    if (!currentValue) {
      throw new Error("Current value not found");
    }

    // Tính toán giá trị mục tiêu
    const targetValue =
      Number(service.fisrt_value_log) + service.fisrt_remaining;

    // Tính toán số lượng cần bảo hành
    const remaining = calculateRemaining(targetValue, currentValue);

    // Nếu số lượng cần bảo hành lớn hơn hoặc bằng 0
    if (remaining > 0) {
      // Cập nhật thông tin dịch vụ cho bảo hành
      await updateServiceForBaoHanh(service, remaining);
      return res.status(200).json({
        success: true,
        message: "Warranty claim successful",
        status: "successful",
        currentValue: currentValue,
        targetValue: targetValue,
        warrantyNumber: remaining,
      });
    } else {
      // Cập nhật thông tin dịch vụ cho hoàn thành
      await updateServiceForCompletion(service, currentValue);

      if (status == "baohanh") {
        return res.status(200).json({
          success: false,
          message: "Service Completed",
          status: "warranty_completed",
          currentValue: currentValue,
          targetValue: targetValue,
        });
      }
      return res.status(200).json({
        success: false,
        message: "Service Completed",
        status: "completed",
        currentValue: currentValue,
        targetValue: targetValue,
      });
    }
  } catch (error) {
    console.error("Error in /service/baohanh:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * Hàm để lấy giá trị hiện tại của dịch vụ
 * @param {string} scriptCode - Mã script của dịch vụ
 * @param {object} data - Dữ liệu của dịch vụ
 * @returns {number} Giá trị hiện tại của dịch vụ
 */
async function getCurrentValue(scriptCode, data) {
  const Order = await getModel("Order");
  return Order.getCurrentValue(scriptCode, data);
}


/**
 * Hàm để tính toán số lượng cần bảo hành
 * @param {number} targetValue - Giá trị mục tiêu
 * @param {number} currentValue - Giá trị hiện tại
 * @returns {number} Số lượng cần bảo hành
 */
function calculateRemaining(targetValue, currentValue) {
  let remaining = targetValue - currentValue;
  if (remaining >= 0) {
    remaining += Math.floor((remaining * 30) / 100);
  }
  return remaining;
}

/**
 * Hàm để cập nhật thông tin dịch vụ cho bảo hành
 * @param {object} service - Đối tượng dịch vụ
 * @param {number} remaining - Số lượng cần bảo hành
 */
async function updateServiceForBaoHanh(service, remaining) {
  await service.updateOne({
    remaining: remaining,
    status: "baohanh",
    $inc: { total_remaining: remaining },
  });
}

/**
 * Hàm để cập nhật thông tin dịch vụ cho hoàn thành
 * @param {object} service - Đối tượng dịch vụ
 * @param {number} currentValue - Giá trị hiện tại
 */
async function updateServiceForCompletion(service, currentValue) {
  await service.updateOne({
    data_reported: currentValue + "-count",
    status: "hoantat",
  });
}
/**
 * Lấy danh sách dịch vụ
 */
router.get("/services", async function (req, res) {
  let scripts = await getModel("Script")
    .find(
      { status: true, code: { $nin: ["search", "end_script"] } },
      "id name code example_data"
    )
    .lean();

  scripts.forEach((script) => {
    let example_data = {};
    if (script.code == "youtube_sub") {
      example_data = { channel_id: "" };
    } else if (script.code == "like_youtube") {
      example_data = { video_id: "" };
    } else if (script.code == "comment_youtube") {
      example_data = { video_id: "", comments: "" };
    } else if (script.code == "watch_video") {
      example_data = { video_id: "" };
    }
    script.example_data = example_data;
  });

  res.json({ success: true, services: scripts });
});

/**
 * Order đơn từ khách hàng
 */
router.post("/service", async function (req, res) {
  let data = req.body;
  let ServiceModel = getModel("Service");
  /**
   * Kiểm tra đơn trùng lặp
   * Trả laij thất bại khi khách đặt liên tục một đơn trong khoảng thời gian ngắn
   */

  let regexData = "";
  switch (data.service_code) {
    case "youtube_sub":
      regexData = data.service_data.channel_id;
      data.service_data.channel_id = extractUsernameOrChannelId(
        data.service_data.channel_id
      );

      break;
    case "like_youtube":
    case "comment_youtube":
    case "watch_video":
      regexData = data.service_data.video_id;
      break;
    default:
      regexData = data.service_data.channel_id;
      break;
  }
  if (previousService == regexData) {
    await sleep(3000);
    previousService = regexData;
    return res.json({
      success: false,
      message:
        "Bạn vừa đặt hàng dịch vụ này trước đó. Hãy đợi cho đơn hoàn thành trước khi tiếp tục",
    });
  } else {
    /**
     * Trả lại false khi có đơn đang chạy
     */
    if (regexData) {
      const findService = await ServiceModel.findOne({
        data: { $regex: regexData },
        remaining: { $gt: 0 },
        is_stop: false,
      });
      previousService = regexData;
      if (findService) {
        return res.json({
          success: false,
          message:
            "Có dịch vụ tương tự đang chạy. Hãy đợi cho đơn hoàn thành trước khi tiếp tục",
          data: {
            remaining: findService.remaining,
            fisrt_remaining: findService.fisrt_remaining,
            fisrt_value_log: findService.fisrt_value_log,
            ...JSON.parse(findService.data),
          },
        });
      }
    }
  }

  previousService = regexData;

  try {
    if (data) {
      if (!data.service_code || !data.total || !data.service_data) {
        return res.json({ success: false, message: "Dữ liệu không hợp lệ" });
      }

      let script = await getModel("Script").findOne({
        code: data.service_code,
      });
      let service;
      if (script) {
        let handleServiceData = {}; //data.service_data
        if (data.service_code == "like_youtube") {
          handleServiceData.video_ids = regexData;
        } else if (data.service_code == "comment_youtube") {
          handleServiceData.video_ids = regexData;
          if (data.service_data.comments) {
            let comments = data.service_data.comments.split("\n");
            data.total = comments.length;

            service = await getModel("Service").create({
              script_code: data.service_code,
              remaining: comments.length,
              data: JSON.stringify({ video_ids: handleServiceData.video_ids }),
            });

            async function createComment(comment) {
              if (comment) {
                return getModel("Comment").create({
                  content: comment,
                  target: service.id,
                });
              }
            }

            await Promise.all(
              comments.map((comment) => createComment(comment))
            );
          }
        } else if (data.service_code == "watch_video") {
          // load video data
          let response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?id=${regexData}&key=AIzaSyA1QcEYwAvCQEXkRvPlFF_IFeEO93cA-GY&part=snippet,contentDetails,statistics`
          );

          handleServiceData.keyword = response.data.items[0].snippet.title;
          handleServiceData.playlist_url = handleServiceData.video_id;
        } else {
          handleServiceData = data.service_data;
        }

        const defaultData = JSON.parse(script.example_data);
        const serviceData = Object.assign(defaultData, handleServiceData);

        if (service) {
          await service.updateOne({
            script_code: data.service_code,
            remaining: data.total,
            data: JSON.stringify(serviceData),
          });
        } else {
          service = await getModel("Service").create({
            script_code: data.service_code,
            remaining: data.total,
            data: JSON.stringify(serviceData),
            start_max_time: data.delay_time ? 399999 : 0,
          });
        }

        if (service) {
          return res.json({
            success: true,
            message: "Tạo dịch vụ thành công",
            service: {
              id: service.id,
              service_code: service.script_code,
              total: data.total,
              service_data: data.service_data,
              fisrt_value_log: service.fisrt_value_log,
            },
          });
        }
      }

      return res.json({ success: false, message: "Không thể tạo dịch vụ" });
    }

    return res.json({ success: false, message: "Dữ liệu không hợp lệ" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
});

module.exports = router;
