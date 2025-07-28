const { getChannelInfo } = require("./youtube-api/getChannelInfo");
const { getLogCode } = require("../../src/utils/getLogCode");

exports.updateServiceStatus = async (orderId, isActive) => {
  const ServiceModel = getModel("Service");
  const currentService = await ServiceModel.findOne({ order_id: orderId });
  if (!currentService) {
    throw new Error("Service not found");
  }

  const responseData = {
    success: true,
    fisrt_remaining: currentService.fisrt_remaining,
    fisrtValue: currentService.fisrt_value_log,
  };

  if (isActive === !currentService.is_stop) {
    responseData.message = isActive
      ? "Service is running"
      : "Service has been temporarily stopped";
    responseData.partial_refund = currentService.partial_refund;
    return responseData;
  }

  let serviceUpdate = {};

  if (currentService.script_code === "youtube_sub") {
    const result = await this.handleYoutubeSubStatus(currentService, isActive);
    Object.assign(responseData, result.responseData);
    Object.assign(serviceUpdate, result.serviceUpdate);
  }

  await ServiceModel.updateOne(
    { order_id: orderId },
    { ...serviceUpdate, is_stop: !isActive }
  );

  return responseData;
};

exports.handleYoutubeSubStatus = async (service, isActive) => {
  const script = await getModel("Script").findOne(
    { code: script_code },
    "logsSubMissing"
  );
  const data = JSON.parse(service.data);
  const channelId = data.channel_id.replace("channel/", "");
  const channelInfo = await getChannelInfo(channelId);

  if (channelInfo.error) {
    throw new Error("Failed to fetch channel information");
  }

  // ... (rest of the YouTube-specific logic)

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

  return { responseData, serviceUpdate };
};

exports.updateAiCreateServiceStatus = async () => {
  const Service = getModel("Service");
  await Service.updateMany(
    { script_code: "ai_create_video", remaining: 1 },
    { remaining: -1 }
  );
  await Service.updateMany(
    { script_code: "create_video_1", remaining: 1 },
    { remaining: -1 }
  );
};

exports.updateAiCreateServiceStatus = async () => {
  const Service = getModel("Service");
  await Service.updateMany(
    { script_code: "ai_create_video", remaining: 1 },
    { remaining: -1 }
  );
  await Service.updateMany(
    { script_code: "create_video_1", remaining: 1 },
    { remaining: -1 }
  );
};

exports.updateCreateVideoService = async () => {
  const Service = getModel("Service");
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Xác định cấu hình số lần thử lại tối đa cho mỗi loại dịch vụ
  const maxRetries = {
    create_image_1: 5,
    create_audio_1: 10,
    video_merge_1: 4,
  };

  // Xác định danh sách các script_code cần xử lý
  const scriptCodes = Object.keys(maxRetries);

  const services = await Service.find({
    script_code: { $in: scriptCodes },
    remaining: { $in: [1] },
    updatedAt: { $gte: thirtyMinutesAgo },
  });

  console.log(
    `Found ${services.length} services with remaining 0 or 1 and updated in the last 30 minutes`
  );

  // Lọc ra những dịch vụ cần cập nhật và tạo mảng các hoạt động cập nhật
  const updateOperations = services
    .filter((service) => {
      const data = JSON.parse(service.data || "{}");
      return !data.link && service.retries < maxRetries[service.script_code];
    })
    .map((service) =>
      Service.updateOne({ _id: service._id }, { remaining: 2 })
    );

  // Thực hiện cập nhật nếu có
  if (updateOperations.length > 0) {
    await Promise.all(updateOperations);
    console.log(`Updated ${updateOperations.length} services to remaining: 2`);
  }
};
