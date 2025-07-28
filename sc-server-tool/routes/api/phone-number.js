const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const imapModule = require("../../modules/imap");
global.apiFlag = {};
const axios = require("axios");

const maxRetry = 60;

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(function () {
      resolve("ok");
    }, ms)
  );
}

function getOrderID(apiKey) {
  // Rusian
  let serviceID = 292;
  let countryId = "";
  let networkId = "";

  switch (youtube_config?.phone_country) {
    case "10":
      serviceID = 292;
      countryId = 10;
      networkId = 2;
      break;
    default:
      serviceID = "go";
      countryId = 0;
      break;
  }

  return (
    fetch(
      `https://2ndline.pro/apiv1/order?apikey=${apiKey}&serviceId=${serviceID}&allowVoiceSms=false&countryId=${countryId}${
        youtube_config?.is_phone_vn ? "&networkId=" + networkId : ""
      }`
    )
      // Nga
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status > 0) {
          return data.id;
        }

        return null;
      })
      .catch((err) => {
        return null;
      })
  );
}

//--------https://thuesimgiare.com/#/document/-----------
function getPhoneThuesimgiareData(apiKey) {
  return fetch(
    `https://access.thuesimgiare.com/api/sim-request?token=${apiKey}&service=7`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.phone) {
        return {
          phone: data.phone,
          orderID: data.phone,
          api_name: "thuesimgiare",
        };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
function getCodeThuesimgiareData(apiKey, orderId) {
  return fetch(
    `https://access.thuesimgiare.com/api/get-message?token=${apiKey}&phone=${orderId}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.status == "COMPLETE") {
        let code = data.message.match(/\d+/)[0];
        return { code: code };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
//-------------------
//--------https://viotp.com/Account/ApiDocument2/-----------
function getPhoneViotpData(apiKey) {
  let carrs = ["MOBIFONE", "VINAPHONE", "VIETTEL"];
  const serviceID =
    youtube_config.is_reg_account &&
    youtube_config.new_account_type == "facebook"
      ? 7
      : 3;
  return fetch(
    `https://api.viotp.com/request/getv2?token=${apiKey}&serviceId=${serviceID}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.data && data.data.phone_number) {
        return {
          phone: data.data.phone_number,
          orderID: data.data.request_id,
          api_name: "viotp",
        };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
function getCodeViotpData(apiKey, orderId) {
  return fetch(
    `https://api.viotp.com/session/getv2?requestId=${orderId}&token=${apiKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.data && data.data.Status == 1) {
        return { code: data.data.Code };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}

function reGetPhoneViotpData(apiKey, number) {
  if (!number.startsWith("0")) {
    number = "0" + number;
  }
  const serviceID = 3;
  return fetch(
    `https://api.viotp.com/request/getv2?token=${apiKey}&serviceId=${serviceID}&number=${number}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.data && data.data.phone_number) {
        return {
          phone: data.data.phone_number,
          orderID: data.data.request_id,
          api_name: "viotp",
        };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}

//-------------------
//--------http://chothuesimcode.com/-----------
function getPhoneChothuesimcodeData(apiKey) {
  let carrs = ["Mobi", "Vina"];
  return fetch(
    `https://chothuesimcode.com/api?act=number&apik=${apiKey}&appId=1005&carrier=${
      carrs[Math.floor(Math.random() * (carrs.length - 1)) + 1]
    }`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.Msg == "OK") {
        return {
          phone: data.Result.Number,
          orderID: data.Result.Id,
          api_name: "chothuesimtot",
        };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
function getCodeChothuesimcodeData(apiKey, orderId) {
  return fetch(
    `https://chothuesimcode.com/api?act=code&apik=${apiKey}&id=${orderId}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.ResponseCode == 0) {
        return { code: data.Result.Code };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
//-------------------
function getPhone2ndlineData(apiKey, orderID) {
  return fetch(
    `https://2ndline.pro/apiv1/ordercheck?apikey=${apiKey}&id=${orderID}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.status) {
        return data;
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
function getPhoneCodeSimData(apiKey) {
  return fetch(
    `http://api.codesim.net/api/CodeSim/DangKy_GiaoDich?apikey=${apiKey}&dichvu_id=2&so_sms_nhan=1`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.stt && data.data.phoneNumber) {
        return {
          phone: data.data.phoneNumber,
          orderID: data.data.id_giaodich,
          api_name: "codesim",
        };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}
function getCodeCodeSim(apiKey, orderID) {
  return fetch(
    `http://api.codesim.net/api/CodeSim/KiemTraGiaoDich?apikey=${apiKey}&giaodich_id=${orderID}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data && data.data.listSms.length) {
        return { code: data.data.listSms[0].number };
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}

async function getPhone(rePhone) {
  let apiNames = [];

  if (
    youtube_config.thuesimgiare_api_key &&
    !youtube_config.thuesimgiare_api_key.startsWith("//")
  ) {
    apiNames.push("thuesimgiare");
  }
  if (
    youtube_config.codesim_api_key &&
    !youtube_config.codesim_api_key.startsWith("//")
  ) {
    apiNames.push("codesim");
  }
  if (
    youtube_config.ndline_api_key &&
    !youtube_config.ndline_api_key.startsWith("//")
  ) {
    apiNames.push("2ndline");
  }
  if (
    youtube_config.chothuesimcode_api_key &&
    !youtube_config.chothuesimcode_api_key.startsWith("//")
  ) {
    apiNames.push("chothuesimtot");
  }
  if (
    youtube_config.viotp_api_key &&
    !youtube_config.viotp_api_key.startsWith("//")
  ) {
    apiNames.push("viotp");
  }

  if (
    youtube_config.gogetsms_api_key &&
    !youtube_config.gogetsms_api_key.startsWith("//")
  ) {
    apiNames.push("gogetsms");
  }

  if (
    youtube_config.five_sim_api_key &&
    !youtube_config.five_sim_api_key.startsWith("//")
  ) {
    apiNames.push("fivesim");
  }

  if (
    youtube_config.sms_activate_api_key &&
    !youtube_config.sms_activate_api_key.startsWith("//")
  ) {
    apiNames.push("smsactivate");
  }

  let apiCode = apiNames[Math.floor(Math.random() * apiNames.length)];

  if (apiCode == "thuesimgiare") {
    let apiKeys = youtube_config.thuesimgiare_api_key.split(",");
    let apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    let phoneData = await getPhoneThuesimgiareData(apiKey);
    if (phoneData) {
      return phoneData;
    }
  } else if (apiCode == "viotp") {
    let apiKeys = youtube_config.viotp_api_key.split(",");
    let apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    let phoneData;
    if (Number(rePhone)) {
      phoneData = await reGetPhoneViotpData(apiKey, rePhone);
    } else {
      phoneData = await getPhoneViotpData(apiKey);
    }

    if (phoneData) {
      return phoneData;
    }
  } else if (apiCode == "chothuesimtot") {
    let apiKeys = youtube_config.chothuesimcode_api_key.split(",");
    let apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    let phoneData = await getPhoneChothuesimcodeData(apiKey);
    if (phoneData) {
      return phoneData;
    }
  } else if (apiCode == "codesim") {
    let apiKey = youtube_config.codesim_api_key;
    let phoneData = await getPhoneCodeSimData(apiKey);
    if (phoneData) {
      return phoneData;
    }
  } else if (apiCode == "2ndline") {
    let apiKeys = youtube_config.ndline_api_key.split(",");
    let apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    let orderID = await getOrderID(apiKey);

    if (orderID) {
      await sleep(15000);
      let retry = 0;
      while (retry < maxRetry) {
        let phoneData = await getPhone2ndlineData(apiKey, orderID);
        if (phoneData && phoneData.data.phone) {
          return {
            phone: phoneData.data.phone.slice(1),
            orderID: orderID,
            api_name: "2ndline",
            apiKey,
          };
        }
        await sleep(4000);
        retry++;
      }
    }
  } else if (apiCode == "gogetsms") {
    let apiKey = youtube_config.gogetsms_api_key;
    let phoneData = await getPhoneGogetsmsData(apiKey);
    if (phoneData) {
      return phoneData;
    }
  } else if (apiCode == "fivesim") {
    let apiKey = youtube_config.five_sim_api_key;
    let phoneData = await getPhoneFiveSimData(apiKey);
    if (phoneData) {
      return phoneData;
    }
  } else if (apiCode == "smsactivate") {
    let apiKey = youtube_config.sms_activate_api_key;
    let phoneData = await getPhoneSmsActivateData(apiKey);
    console.log("phoneData", phoneData);
    if (phoneData) {
      return phoneData;
    }
  }

  return { error: apiCode };
}

async function getCode(api_name, orderID) {
  if (api_name == "thuesimgiare") {
    let apiKey = youtube_config.thuesimgiare_api_key;
    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeThuesimgiareData(apiKey, orderID);
      if (codeData) {
        return codeData;
      }
      await sleep(5000);
      retry++;
    }
  } else if (api_name == "viotp") {
    let apiKey = youtube_config.viotp_api_key;
    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeViotpData(apiKey, orderID);
      if (codeData) {
        return codeData;
      }
      await sleep(5000);
      retry++;
    }
  } else if (api_name == "chothuesimtot") {
    let apiKey = youtube_config.chothuesimcode_api_key;
    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeChothuesimcodeData(apiKey, orderID);
      if (codeData) {
        return codeData;
      }
      await sleep(5000);
      retry++;
    }
  } else if (api_name == "codesim") {
    let apiKey = youtube_config.codesim_api_key;

    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeCodeSim(apiKey, orderID);
      if (codeData) {
        return codeData;
      }
      await sleep(4000);
      retry++;
    }
  } else if (api_name == "2ndline") {
    let apiKey; //= youtube_config.ndline_api_key
    Object.keys(apiFlag).forEach((key) => {
      if (apiFlag[key] && apiFlag[key].some((id) => id == orderID)) {
        apiKey = key;
        return;
      }
    });
    if (orderID && apiKey) {
      let retry = 0;
      const maxRetry = 35;
      while (retry < maxRetry) {
        let phoneData = await getPhone2ndlineData(apiKey, orderID);
        if (phoneData && phoneData.data.code) {
          return { code: phoneData.data.code };
        }
        await sleep(5000);
        retry++;
      }
    }
  } else if (api_name == "gogetsms") {
    let apiKey = youtube_config.gogetsms_api_key;
    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeGogetsmsData(apiKey, orderID);
      if (codeData) {
        return codeData;
      }
      await sleep(5000);
      retry++;
    }
  } else if (api_name == "fivesim") {
    let apiKey = youtube_config.five_sim_api_key;
    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeFiveSimData(apiKey, orderID);
      if (codeData?.code) {
        return codeData;
      }
      await sleep(5000);
      retry++;
    }
  } else if (api_name == "smsactivate") {
    let apiKey = youtube_config.sms_activate_api_key;
    let retry = 0;
    while (retry < maxRetry) {
      let codeData = await getCodeSmsActivateData(apiKey, orderID);
      if (codeData) {
        return codeData;
      }
      await sleep(18000);
      retry++;
    }
  }
}

router.get("/", async function (req, res) {
  let rePhone = req.query.re_phone;
  let phone = await getPhone(rePhone);
  console.log(phone);

  if (!phone.error) {
    if (!apiFlag[phone.apiKey]) {
      apiFlag[phone.apiKey] = [];
    }

    apiFlag[phone.apiKey].push(phone.orderID);
    return res.send(phone);
  }
  return res.send({ error: "Cannot get phone:" + phone.error });
});

router.get("/code", async function (req, res) {
  let orderID = req.query.order_id;
  let api_name = req.query.api_name;

  let codeData = await getCode(api_name, orderID);
  if (codeData) {
    return res.send(codeData);
  }

  return res.send({ error: "Cannot get code :" + api_name });
});

router.get("/mail-code", async function (req, res) {
  let pid = req.query.mail;

  let senderFilter = "noreply@google.com";
  let email, password;
  if (pid.startsWith("fb_")) {
    senderFilter = "security@facebookmail.com";
    pid = pid.replace("fb_", "");
    let pReco = await getModel("Profile").findOne({ id: Number(pid) });
    if (pReco) {
      email = pReco.imap_email;
      password = pReco.imap_password;
    }
  } else {
    let pReco = await getModel("Profile").findOne({ id: Number(pid) });
    if (pReco) {
      email = pReco.email;
      password = pReco.password;
    }
  }
  senderFilter = "noreply@openai.com";

  let codes = await imapModule.getVeiryCode(
    {
      email: email,
      password: password,
    },
    senderFilter
  );
  return res.send({ success: true, code: codes });
});

router.get("/report-mail-code", async function (req, res) {
  let pid = req.query.pid;
  let codes = req.query.codes;

  let codeData = wait_code[pid];
  if (codeData == -1) {
    return res.send({ stop: true });
  } else {
    if (codes) {
      if (!wait_code[pid]) {
        wait_code[pid] = "";
      }
      wait_code[pid] += codes;
    }
  }

  return res.send({});
});

router.get("/get-reco-mails", async function (req, res) {
  let mail = req.query.mail;

  let excludeMails = [];
  let p = await getModel("Profile").findOne({ id: req.query.pid });
  if (p && p.reco_mails.length) {
    excludeMails = p.reco_mails;
  }

  let mails = await getModel("Profile")
    .find(
      {
        $and: [{ email: { $nin: excludeMails } }, { email: { $regex: mail } }],
      },
      "email"
    )
    .limit(3);
  let emails = mails.map((m) => m.email);

  if (emails.length) {
    await getModel("Profile").updateOne(
      { id: req.query.pid },
      { $addToSet: { reco_mails: { $each: emails } } }
    );
  }
  return res.send({ emails });
});

module.exports = router;

async function getPhoneGogetsmsData(apiKey) {
  /**
   * Mặc định việt nam
   */
  let country = youtube_config?.phone_country || 10;

  const apiUrl = "https://www.gogetsms.com/handler_api.php";
  const params = {
    api_key: apiKey,
    action: "getNumber",
    service: 7,
    country: country,
  };

  try {
    // Make the GET request with query parameters
    const response = await axios.get(apiUrl, { params });
    // Handle the response data
    const parts = response?.data?.split(":");

    return {
      phone: parts[2],
      orderID: parts[1],
      api_name: "gogetsms",
    };
  } catch (error) {
    // Handle errors
    if (error.response) {
      // Server responded with a status other than 2xx
    } else if (error.request) {
      // No response was received
    } else {
      // Error setting up the request
      console.error("Error:", error.message);
    }
  }
}

function getCodeGogetsmsData(apiKey, orderId) {
  const apiUrl = "https://www.gogetsms.com/handler_api.php";

  // Định nghĩa các tham số truy vấn
  const params = {
    api_key: apiKey,
    action: "getStatus",
    id: orderId,
  };

  return axios
    .get(apiUrl, { params })
    .then((response) => {
      const data = response.data || "";

      if (data.includes("STATUS_OK")) {
        const parts = data.split(":");
        return { code: parts[1]?.substring(2) };
      }
      return null;
    })
    .catch((error) => {
      console.log("Error while getting phone:", error);
      return null;
    });
}

async function getPhoneFiveSimData(apiKey) {
  let country = youtube_config?.phone_country;
  let service = "any";
  switch (country) {
    case "187":
      country = "usa";
      service = "virtual8";

      break;
    case "lithuania":
      country = "lithuania";
      service = "virtual4";
      break;
    case "indonesia":
      country = "indonesia";
      service = "virtual52";
      break;
    case "thailand":
      country = "thailand";
      service = "virtual4";
      break;
    case "16":
      country = "england";
      service = "virtual52";
    default:
      country = "england";
      service = "virtual52";
      break;
  }

  console.log(
    `https://5sim.net/v1/user/buy/activation/${country}/${service}/google`
  );
  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://5sim.net/v1/user/buy/activation/${country}/${service}/google`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    };

    const response = await axios.request(config);
    const data = response.data;
    console.log(data);

    let phone = data?.phone?.slice(2);

    switch (country) {
      case "lithuania":
        phone = data?.phone?.slice(4);
        break;
      case "indonesia":
      case "thailand":
        phone = data?.phone?.slice(3);
        break;
      case "england":
        phone = data?.phone?.slice(3);
        break;
      default:
        break;
    }
    // Trả về dữ liệu

    return phone
      ? {
          phone: phone,
          orderID: data?.id,
          api_name: "fivesim",
        }
      : null;
  } catch (error) {
    // console.log(error);
    // Có thể trả về một giá trị mặc định hoặc lỗi để dễ xử lý sau này
    return null;
  }
}

async function getCodeFiveSimData(apiKey, orderId) {
  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://5sim.net/v1/user/check/${orderId}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    };

    const response = await axios.request(config);
    const data = response.data;
    console.log(112, { code: data?.sms?.[0]?.code });
    // Trả về dữ liệu code từ sms
    return { code: data?.sms?.[0]?.code };
  } catch (error) {
    console.log(error);
    // Có thể trả về một giá trị mặc định hoặc lỗi để dễ xử lý sau này
    return { error: true };
  }
}

async function getPhoneSmsActivateData(apiKey) {
  const Country = await getModel("Country");
  const Config = await getModel("Config");
  const config = await Config.findOne({ key: "system" });

  let country = Array.isArray(youtube_config?.phone_country)
    ? youtube_config?.phone_country[
        Math.floor(Math.random() * youtube_config?.phone_country.length)
      ]
    : youtube_config?.phone_country;

  switch (country) {
    case "187":
      country = "12";
      break;
    case "colombia":
      country = "33";
      break;
    case "36":
      country = "36";
      break;
    case "16":
      country = "16";
      break;
    case "indonesia":
      country = "6";
      break;
    case "thailand":
      country = "52";
      break;
    default:
      break;
  }

  try {
    let configRequest = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://api.sms-activate.ae/stubs/handler_api.php?api_key=${apiKey}&action=getNumberV2&service=go&forward=0&country=${country}&maxPrice=${
        config.data.max_price || 20
      }`,
    };
    console.log(
      `https://api.sms-activate.ae/stubs/handler_api.php?api_key=${apiKey}&action=getNumberV2&service=go&forward=0&country=${country}&maxPrice=${
        config.data.max_price || 20
      }`
    );
    const response = await axios.request(configRequest);
    const data = response.data;

    const phone = data?.phoneNumber;
    const currentCountry = await Country.findOne(
      { id: country },
      "-_id -createdAt -updatedAt"
    );
    console.log(
      "🚀 ~ getPhoneSmsActivateData ~ currentCountry:",
      currentCountry
    );

    if (!phone) {
      const Log = await getModel("Log");
      await Log.create({
        script_code: "get phone",
        message: JSON.stringify(data),
      });
      return null;
    } else {
      console.log({ phone });
      return {
        phone: phone,
        orderID: data?.activationId,
        api_name: "smsactivate",
        country: currentCountry?.key || country,
        cost: data.activationCost,
      };
    }
  } catch (error) {
    console.log(error);
    // Có thể trả về một giá trị mặc định hoặc lỗi để dễ xử lý sau này
  }
}

async function getCodeSmsActivateData(apiKey, orderId) {
  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://api.sms-activate.ae/stubs/handler_api.php?api_key=${apiKey}&action=getStatusV2&id=${orderId}`,
      // url: `https://api.sms-activate.ae/stubs/handler_api.php?api_key=${apiKey}&action=getStatus&id=${orderId}`,
    };

    // ("https://api.sms-activate.ae/stubs/handler_api.php?api_key=$api_key&action=getStatusV2&id=$id˝");
    const response = await axios.request(config);
    const data = response.data;

    // Trả về dữ liệu code từ sms
    return data?.sms?.code ? { code: data?.sms?.code } : null;
  } catch (error) {
    // Có thể trả về một giá trị mặc định hoặc lỗi để dễ xử lý sau này
    return null;
  }
}
