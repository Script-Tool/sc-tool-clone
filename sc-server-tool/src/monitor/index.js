const fetch = require("node-fetch");
const fs = require("fs");
const rootApiRequest = require("../../modules/root-api-request");
const { getChannelInfo } = require("../services/youtube-api/getChannelInfo");
const { getVideoInfo } = require("../services/youtube-api/getVideoInfo");
const {
  checkAndUpdateYoutubeService,
} = require("../services/checkAndUpdateYoutubeService");
function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function getCurrentProxy(api_key) {
  return fetch("https://tmproxy.com/api/proxy/get-current-proxy", {
    method: "post",
    body: JSON.stringify({
      api_key: api_key,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.data.https) {
        return data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Error while get proxy v4: ", err);
      return null;
    });
}

async function getNewProxy(api_key) {
  return fetch("https://tmproxy.com/api/proxy/get-new-proxy", {
    method: "post",
    body: JSON.stringify({
      api_key: api_key,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.data.https) {
        return data;
      }
      return null;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
}

function handleProxyData(tmData, apiData) {
  if (tmData && tmData.data.https) {
    return {
      api_id: apiData._id.toString(),
      server: tmData.data.https,
      timeout: !tmData.data.expired_at ? 3600000 : tmData.data.timeout,
      last_check: Date.now(),
    };
  }
  return null;
}

async function handleAddSub(service) {
  try {
    let data = JSON.parse(service.data);
    const OrderModel = getModel("Order");
    let currentValue = await OrderModel.getCurrentValue(
      service.script_code,
      data
    );

    let targetValue =
      Number(service.fisrt_value_log) + Number(service.fisrt_remaining);
    let remaining = targetValue - currentValue;

    let updateData = {
      current_sub: currentValue,
    };
    if (remaining > 0) {
      remaining += Math.floor((remaining * 30) / 100);
      remaining += 10;

      updateData.total_remaining =
        updateData.total_remaining || 0 + (remaining - service.remaining) || 0;
      updateData.remaining = remaining;
      updateData.last_remaining_sub = remaining;

      await service.updateOne(updateData);
    } else {
      await service.updateOne({ last_remaining_sub: -1 });
    }
  } catch (error) {
    //console.log(error)
  }
}

module.exports = {
  checkSub: async function () {
    const Script = getModel("Script");
    let ytSubScript = await Script.findOne({ code: "youtube_sub" }).lean();
    if (ytSubScript && ytSubScript.status) {
      const ServiceModel = getModel("Service");

      let perpage = 50;
      let currentPage = 0;
      let subServices = [];
      do {
        if (subServices.length) {
          await Promise.all(
            subServices.map((subService) => handleAddSub(subService))
          );
        }
        subServices = await ServiceModel.find({
          script_code: "youtube_sub",
          last_remaining_sub: { $ne: -1 },
        })
          .skip(currentPage * perpage)
          .limit(perpage);
        currentPage++;
      } while (subServices.length);
    }
  },
  checkPayment: async function () {
    try {
      if (
        !process.env.PAYMENT_ACCESS_TOKEN ||
        process.env.SERVER_TYPE != "customer"
      ) {
        return;
      }

      const accessToken = process.env.PAYMENT_ACCESS_TOKEN;
      const WalletModel = getModel("Wallet");
      const CustomerModel = getModel("Customer");
      const PaymentJounal = getModel("PaymentJounal");

      let url = `https://api.apithanhtoan.com/api/history?offset=0&limit=20&memo=&accountNumber=&accessToken=${accessToken}&bankCode=vcb`;
      let rs = await fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            return data;
          }
          return null;
        })
        .catch((err) => {
          console.log("Error while get check bank history ", err);
          return null;
        });

      if (!rs || !Array.isArray(rs.data)) {
        console.log("Not found payment results");
        return;
      }

      for await (let item of rs.data) {
        item.memo = item.memo.toUpperCase();
        let regexp = /VIES[\w|.]*PAY/;
        let match = regexp.exec(item.memo);
        let PaymentCode = "";
        if (match && match[0] && match[0].startsWith("VIES")) {
          PaymentCode = match[0];
        } else {
          continue;
        }

        if (item.type == "deposit" && item.money.startsWith("+")) {
          let totalReCharge = Number(item.money.replace(/[,|+]/g, ""));
          const ref = item.referenceNumber;

          // check exist payment
          let exist = await PaymentJounal.findOne({ ref: ref });
          if (exist) {
            return;
          }

          console.log(
            "-----> recharge for :" + PaymentCode + "--" + totalReCharge
          );
          const customer = await CustomerModel.findOne({
            payment_code: PaymentCode,
          });
          if (customer) {
            const wallet = await WalletModel.findOne({
              customer: customer._id,
            });
            if (wallet) {
              try {
                await wallet.recharge(totalReCharge);
                await PaymentJounal.createPaymentJounal({
                  customer,
                  old_wallet: wallet,
                  totalReCharge,
                  type: "recharge",
                  ref,
                });
              } catch (error) {
                console.log(error);
              }
            }
          } else {
            console.log("Customer not found");
          }
        }
      }
    } catch (error) {
      console.log("error while check payments", error);
    }
  },
  checkOrderData: async function () {
    if (process.env.SERVER_TYPE != "customer") {
      return;
    }

    const OrderModel = getModel("Order");
    let orderRunning = await OrderModel.find({
      status: "running",
      "package.type": "run_service",
    });
    for await (let order of orderRunning) {
      let rs = await rootApiRequest.request({
        url: "/service/" + order.order_result,
        method: "GET",
      });

      if (rs.data.success && rs.data.service.remaining == 0) {
        // check value before complete
        if (order.fisrt_value_log) {
          let currentValue = "";
          let totalTarget = Number(order.fisrt_value_log) + order.package.value;
          if (order.package.script_code == "youtube_sub") {
            try {
              currentValue = await OrderModel.getCurrentValue(
                order.package.script_code,
                order.customer_values
              );
            } catch (error) {
              console.log(error);
              continue;
            }
          }

          if (Number(currentValue) && currentValue < totalTarget) {
            currentValue = Number(currentValue);
            // call to server tool add more value
            let additional_value = totalTarget - currentValue;
            additional_value += (additional_value * 15) / 100;
            additional_value = Math.floor(additional_value);
            if (additional_value) {
              await rootApiRequest.request({
                url: "/service/additional",
                method: "POST",
                data: {
                  service_id: order.order_result,
                  additional_value,
                },
              });
              continue;
            }
          }
        }

        await order.updateOne({ status: "complete" });
      }
    }
  },
  loadScriptsReady: async function () {
    const ScriptModel = getModel("Script");
    const ServiceModel = getModel("Service");

    let scripts = await ScriptModel.find();
    for await (let script of scripts) {
      if (!scriptsReady[script.code]) {
        scriptsReady[script.code] = [];
      }

      if (script.code == "create_playlist") {
        let timerServices = await ServiceModel.find(
          {
            script_code: script.code,
            start_max_time: { $gt: 0 },
            id: { $nin: scriptsReady[script.code] },
          },
          "id start_max_time end_max_time last_report_time"
        );

        for await (let service of timerServices) {
          if (service.last_report_time) {
            let randomTime = service.end_max_time
              ? randomIntFromInterval(
                  service.start_max_time,
                  service.end_max_time
                )
              : service.start_max_time;
            let isInTime = Date.now() - service.last_report_time > randomTime;
            if (!isInTime) {
              continue;
            }
          }

          if (!scriptsReady[script.code].includes(service.id)) {
            scriptsReady[script.code].push(service.id);
            await service.updateOne({
              start_max_time: 900000,
              end_max_time: 900000,
              last_report_time: Date.now(),
            });
          }
        }
      } else {
        let timerServices = await ServiceModel.find(
          {
            is_stop: { $ne: true },
            script_code: script.code,
            start_max_time: { $gt: 0 },
            $or: [
              { remaining: { $gt: 0 } },
              {
                remaining: -1,
                script_code: {
                  $nin: [
                    "comment_youtube",
                    "watch_video",
                    "youtube_sub",
                    "like_youtube",
                  ],
                },
              },
            ],
            id: { $nin: scriptsReady[script.code] },
          },
          "id last_report_time start_max_time end_max_time"
        );

        for await (let service of timerServices) {
          if (service.last_report_time) {
            let randomTime = service.start_max_time;
            let isInTime = Date.now() - service.last_report_time > randomTime;
            if (!isInTime) {
              continue;
            }
          }

          scriptsReady[script.code].push(service.id);
        }
      }
    }
  },
  checkKeyMonitor: async function () {
    const KeyModel = getModel("Key");
    let keys = await KeyModel.find({ status: true });
    for (let key of keys) {
      if (Number(key.time) < Date.now()) {
        await key.updateOne({ status: false });
      }
    }
  },
  profileMonitor: async function () {
    let ProfileModel = getModel("Profile");
    await ProfileModel.updateMany(
      {
        status: { $in: ["SYNCING"] },
        updatedAt: {
          // 10 minutes ago (from now)
          $lt: new Date(Date.now() - 1000 * 60 * 20),
        },
      },
      { $set: { status: "NEW" } }
    );

    await ProfileModel.updateMany(
      {
        status: { $in: ["SYNCED"] },
        updatedAt: {
          // 15 minutes ago (from now)
          $lt: new Date(Date.now() - 1000 * 60 * 20),
        },
      },
      { $set: { status: "SUSPEND" } }
    );
  },
  logViewYoutube: async function () {
    let Config = getModel("Config");
    let myDate = new Date();
    let hour = Number(
      myDate
        .toLocaleTimeString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          hour12: false,
        })
        .split(":")[0]
    );
    statisView.push({
      h: hour,
      countView,
      countAds,
      countPlayListViews,
    });
    countView = 0;
    countAds = 0;
    // countPlayListViews = 0;

    if (statisView.length > 12) {
      statisView.shift();
    }

    let configData = {
      key: "view_logs",
      data: {
        items: statisView,
      },
    };
    await Config.findOneAndUpdate({ key: configData.key }, configData, {
      upsert: true, // Make this update into an upsert
    });
  },
  appMonitor: async function () {
    const TIME_REPORT = 320000;
    vmRunnings = vmRunnings.filter(
      (vm) => Date.now() - vm.updatedAt < TIME_REPORT
    );

    try {
      let ProfileModel = getModel("Profile");
      let pidRunning = [];
      vmRunnings.forEach((vm) => {
        vm.pids.forEach((id) => {
          if (id && id != "undefined") {
            pidRunning.push(Number(id));
          }
        });
      });

      await ProfileModel.updateMany(
        {
          id: { $in: pidRunning },
          status: { $nin: ["SYNCING", "SYNCED", "ERROR", "RESET"] },
        },
        { $set: { status: "SYNCED" } }
      );
    } catch (error) {
      console.log(error);
    }
  },
  logBAT: async function () {
    let Profile = getModel("Profile");
    let Config = getModel("Config");
    let profiles = await Profile.find(
      {
        total_bat: { $gt: 0 },
      },
      "total_bat"
    );

    let totalBat = profiles.reduce((total, item) => {
      return total + Number(item.total_bat);
    }, 0);

    if (totalBat) {
      let myDate = new Date();
      let hour = Number(
        myDate
          .toLocaleTimeString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour12: false,
          })
          .split(":")[0]
      );
      let dataLog = {
        total_bat: totalBat,
        report_time: myDate.toLocaleTimeString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        }),
        h: hour,
      };
      statisBAT.push(dataLog);

      if (statisBAT.length >= 25) {
        statisBAT.shift();
      }

      if (hour == 23) {
        let totalBatOfDat = statisBAT[statisBAT.length - 1].total_bat;
        let logLine = `\n${totalBatOfDat} BAT - ${new Date().toLocaleDateString(
          "vi-VN",
          { timeZone: "Asia/Ho_Chi_Minh" }
        )}`;
        let date = new Date();
        let logPath = `logs/BAT-${date.getMonth()}-${date.getFullYear()}.txt`;
        if (!fs.existsSync(logPath)) {
          fs.writeFileSync(logPath, "LOG BAT FILE");
        }
        fs.appendFileSync(logPath, logLine);
      }
    }
    let configData = {
      key: "bat_logs",
      data: {
        items: statisBAT,
      },
    };
    await Config.findOneAndUpdate({ key: configData.key }, configData, {
      upsert: true, // Make this update into an upsert
    });
  },
  proxyV4Monitor: async function () {
    const time_check = 300000;
    let ProxyV4 = getModel("ProxyV4");
    let apiData = await ProxyV4.find();
    let newProxies = [];

    for await (let itemData of apiData) {
      let proxy = {};
      let currentProxy = proxiesV4.find((i) => i.api_id == itemData._id);
      if (!currentProxy) {
        let tmData = await getCurrentProxy(itemData.api_key);
        currentProxy = handleProxyData(tmData, itemData);
      }

      if (
        !currentProxy ||
        Number(currentProxy.last_check) +
          Number(currentProxy.timeout) * 1000 -
          time_check <
          Date.now()
      ) {
        let tmData = await getNewProxy(itemData.api_key);
        proxy = handleProxyData(tmData, itemData);
      } else {
        proxy = currentProxy;
      }

      if (proxy && proxy.server) {
        // let checkRs = await proxy_check(proxy.server).then(r => {
        //   return true
        // }).catch(e => {
        //   return false
        // });

        // if (checkRs) {
        //   newProxies.push(proxy)
        // }
        newProxies.push(proxy);
      }
    }

    proxiesV4 = newProxies;
  },
  loadReadyProfiles: async function () {
    const ProfileModel = getModel("Profile");
    const profilesReady = await ProfileModel.find(
      { status: "NEW", id: { $nin: ready_profiles } },
      "id status"
    ).sort({ last_time_reset: 1 });
    const pids = profilesReady.map((p) => p.id);
    ready_profiles.push(...pids);
  },
  processDataFromMainServer: async function () {
    const CustomerModel = getModel("Customer");

    let customers = await CustomerModel.find({});
    if (customers.length > 1) {
      let rs = await rootApiRequest.request({
        url: "/script/get-active-scripts",
        method: "GET",
      });

      if (rs.data.success) {
        let rootScriptCodes = rs.data.scripts.map((sc) => sc.code);

        for (let customer of customers) {
          let runningScripts = customer.scripts_running;
          if (runningScripts.length) {
            let runningScriptsFilter = runningScripts.filter((_script) =>
              rootScriptCodes.includes(_script.code)
            );
            let isChanged = false;
            if (
              runningScriptsFilter.length &&
              !runningScriptsFilter.some((_sc) => _sc.is_break)
            ) {
              runningScriptsFilter[
                runningScriptsFilter.length - 1
              ].is_break = true;
              isChanged = true;
            }
            if (runningScriptsFilter.length != runningScripts.length) {
              isChanged = true;
            }
            if (isChanged) {
              await customer.updateOne({
                scripts_running: runningScriptsFilter,
              });
            }
          }
        }
      }
    }
  },
  checkStatusScript: async function () {
    try {
      const Service = await getModel("Service");

      // Định nghĩa các loại dịch vụ được hỗ trợ
      const SUPPORTED_SERVICES = {
        VIDEO_SERVICES: ["watch_video", "like_youtube", "comment_youtube"],
        SUBSCRIPTION_SERVICES: ["youtube_sub"],
      };

      // Lấy các dịch vụ cần kiểm tra
      const services = await Service.find({
        script_code: {
          $in: [
            ...SUPPORTED_SERVICES.VIDEO_SERVICES,
            ...SUPPORTED_SERVICES.SUBSCRIPTION_SERVICES,
          ],
        },
        remaining: 1,
      });

      // Xử lý từng dịch vụ
      await Promise.all(
        services.map(async (service) => {
          try {
            const serviceData = JSON.parse(service.data);

            if (
              SUPPORTED_SERVICES.VIDEO_SERVICES.includes(service.script_code)
            ) {
              const videoId =
                service.script_code === "watch_video"
                  ? serviceData.playlist_url
                  : serviceData.video_id;

              const videoInfo = await getVideoInfo(videoId);
              if (!videoInfo) {
                console.warn(
                  `Không tìm thấy thông tin video cho ID: ${videoId}`
                );
                return;
              }

              // Lấy số liệu phù hợp dựa trên loại dịch vụ
              let metricCount;
              switch (service.script_code) {
                case "watch_video":
                  metricCount = videoInfo.statistics.viewCount;
                  break;
                case "like_youtube":
                  metricCount = videoInfo.statistics.likeCount;
                  break;
                case "comment_youtube":
                  metricCount = videoInfo.statistics.commentCount;
                  break;
              }

              await checkAndUpdateYoutubeService(
                parseInt(metricCount),
                service
              );
            } else if (service.script_code === "youtube_sub") {
              const channelInfo = await getChannelInfo(serviceData.channel_id);

              if (channelInfo && !channelInfo.error) {
                await checkAndUpdateYoutubeService(
                  parseInt(channelInfo.subscriberCount),
                  service
                );
              }
            }
          } catch (error) {
            console.error(`Lỗi xử lý dịch vụ ${service._id}:`, error.message);
          }
        })
      );
    } catch (error) {
      console.error("Lỗi nghiêm trọng trong checkStatusScript:", error);
      throw error;
    }
  },
};
