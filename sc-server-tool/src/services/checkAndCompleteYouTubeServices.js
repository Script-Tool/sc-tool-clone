// src/utils/index.js

const axios = require("axios");
const extractUsernameOrChannelId = require("../utils/extractUsernameOrChannelId");

async function checkAndCompleteYouTubeServices() {
  try {
    const ServiceModel = getModel("Service");
    const BATCH_SIZE = 20;
    let completedCount = 0;
    let results = [];

    const APIKEY = getModel("APIKey");
    const papidapiKey =
      (await APIKEY.getRandomKey("rapidapi")) ||
      "701034935dmshefcb89a6a01c8d0p1de1d2jsn4273dab997f9";

    const extractChannelId = (channelId) => {
      if (channelId.startsWith("channel/")) return channelId.substring(8);
      return channelId.startsWith("@") ? channelId.substring(1) : channelId;
    };

    async function processServiceBatch(services) {
      return Promise.all(
        services.map(async (service) => {
          try {
            const data = JSON.parse(service.data);
            let channelId = extractChannelId(
              extractUsernameOrChannelId(data.channel_id)
            );

            const isHandle = channelId.includes("@");
            const identifier = isHandle ? channelId.substring(1) : channelId;
            const params = isHandle
              ? { forUsername: identifier }
              : { id: identifier };

            const options = {
              method: "GET",
              url: "https://yt-api.p.rapidapi.com/channel/home",
              params: params,
              headers: {
                "x-rapidapi-key": papidapiKey,
                "x-rapidapi-host": "yt-api.p.rapidapi.com",
              },
              timeout: 10000,
            };

            const response = await axios.request(options);

            if (
              (response?.data?.code == 403 &&
                (response?.data?.msg?.includes("terminated") ||
                  response?.data?.msg?.includes("removed"))) 
                  ||
              !response?.data?.meta?.subscriberCount
            ) {
              await ServiceModel.findOneAndUpdate(
                { _id: service._id },
                {
                  $set: {
                    remaining: 0,
                    status: "completed",
                    note: "Channel terminated or removed",
                  },
                }
              );
              completedCount++;
              return {
                serviceId: service._id,
                completed: true,
                reason: "Channel terminated or removed",
              };
            }

            const currentSubs = response.data.meta.subscriberCount;
            const targetSubs =
              Number(service.fisrt_value_log) + Number(service.fisrt_remaining);

            if (currentSubs >= targetSubs) {
              await ServiceModel.findOneAndUpdate(
                { _id: service._id },
                { $set: { remaining: 0, status: "completed" } }
              );
              completedCount++;
              return {
                serviceId: service._id,
                completed: true,
                currentSubs,
                targetSubs,
              };
            }

            return {
              serviceId: service._id,
              completed: false,
              currentSubs,
              targetSubs,
            };
          } catch (error) {
            console.error(`Error processing service ${service._id}:`, error);
            if (error.response && error.response.status === 404) {
              await ServiceModel.findOneAndUpdate(
                { _id: service._id },
                {
                  $set: {
                    remaining: 0,
                    status: "completed",
                    note: "Channel not found",
                  },
                }
              );
              completedCount++;
              return {
                serviceId: service._id,
                completed: true,
                reason: "Channel not found",
              };
            }
            return {
              serviceId: service._id,
              completed: false,
              error: error.message,
            };
          }
        })
      );
    }

    let skip = 0;
    while (true) {
      const services = await ServiceModel.find({
        script_code: "youtube_sub",
        remaining: { $gt: 0 },
        is_stop: { $ne: true },
      })
        .skip(skip)
        .limit(BATCH_SIZE);

      if (services.length === 0) break;

      const batchResults = await processServiceBatch(services);
      results = results.concat(batchResults);
      skip += BATCH_SIZE;

      // Thêm một khoảng thời gian nghỉ ngắn giữa các batch để tránh quá tải API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`Completed ${completedCount} YouTube subscriber services`);
    return { success: true, completedCount, results };
  } catch (error) {
    console.error("Error in checkAndCompleteYouTubeServices:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  // ... other existing exports
  checkAndCompleteYouTubeServices,
};
