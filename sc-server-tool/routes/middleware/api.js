const bcrypt = require("bcrypt");

async function authenticateWithClientKey(req, res, next) {
  const ConfigModel = getModel("Config");
  const systemConfig = await ConfigModel.findOne({ key: "system" });
  const clientKeyFromConfig = systemConfig?.data?.client_key;
  const clientKeyFromEnv = process.env.CLIENT_KEY;

  const authKey = req.headers.authorization || "";
  const clientKey = req.query.key;

  if (
    authKey === `Bearer ${clientKeyFromEnv}` ||
    authKey ===
      `Bearer 8155e3d6b9ff9119156d93b5cf0dc8603194058e9d7e02940784c673c70139cb` ||
    authKey === `Bearer ${clientKeyFromConfig}` ||
    (clientKey && clientKey === clientKeyFromEnv) ||
    (clientKey && clientKey === clientKeyFromConfig)
  ) {
    next(); // Xác thực thành công, tiếp tục xử lý request
  } else {
    res.json({ message: "Missing or Invalid API KEY" }); // Xác thực thất bại
  }
}

module.exports = {
  toolServiceAPIAuth: async function (req, res, next) {
    await authenticateWithClientKey(req, res, next);
  },
  checkWinToolApi: async function (req, res, next) {
    let apiKey = req.headers.api_key;
    let customer = await getModel("Customer").findOne({ api_key: apiKey });
    if (customer) {
      req.customer = customer;
      next();
    } else {
      res.json({ message: "API Key Invalid" });
    }
  },
  checkPartnerApiV2: async function (req, res, next) {
    await authenticateWithClientKey(req, res, next);
  },
  checkPartnerApi: async function (req, res, next) {
    await authenticateWithClientKey(req, res, next);
  },
  checkAPIKey: async function (req, res, next) {
    let apiKey = req.headers.api_key;
    if (apiKey) {
      if (apiKey == process.env.API_KEY) {
        next();
        return;
      } else {
        const KeyModel = await getModel("Key");
        let checkKey = await KeyModel.findOne({ key: apiKey, status: true });
        if (checkKey) {
          next();
          return;
        } else {
          return res.json({ message: "API KEY Incorrect", error_code: 401 });
        }
      }
    }

    return res.json({ message: "Missing API KEY" });
  },
  checkRootApi: async function (req, res, next) {
    let access_key = req.headers.access_key;

    if (access_key) {
      let rs = await bcrypt.compare(
        access_key,
        bcrypt.hashSync(process.env.SECRET, 10)
      );
      if (rs) {
        next();
      } else {
        return res.json({ message: "Missing Access KEY" });
      }
    } else {
      console.log();
      return res.json({ message: "Missing Access KEY" });
    }
  },
  link: async function (req, res, next) {
    const access_key = req.query.keyAuth;
    const secretKey = process.env.SECRET_LINK;

    if (!access_key) {
      return res.status(401).json({ message: "Missing Access KEY" });
    }

    try {
      // So sánh access_key với SECRET đã được hash
      const isValid = await bcrypt.compare(
        access_key,
        bcrypt.hashSync(secretKey, 10)
      );

      if (isValid) {
        next();
      } else {
        return res.status(401).json({ message: "Invalid Access KEY" });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};
