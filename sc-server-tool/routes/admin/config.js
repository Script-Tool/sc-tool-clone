const express = require("express");
var router = express.Router();
const modelName = "Config";

router.get("/update-chart-channel", async function (req, res) {
  try {
    let yData = req.query.data;

    if (Array.isArray(yData)) {
      youtube_config.percent_view_channel_youtube = yData;
      let ConfigModel = await getModel("Config");
      await ConfigModel.updateOne({ key: "system" }, { data: youtube_config });
    }

    res.send({ success: true });
  } catch (e) {
    console.log("error", "update " + modelName + " err: ", e);
    res.send({ err: e });
  }
});

router.post("/post-update", async function (req, res) {
  try {
    let updateConfig = req.body;

    if (!updateConfig.trace_names_ex) {
      updateConfig.trace_names_ex = [];
    }
    if (updateConfig.is_profile_active) {
      updateConfig.is_profile_active =
        updateConfig.is_profile_active === "true";
    }

    Object.assign(youtube_config, updateConfig);
    if (typeof updateConfig === "object") {
      let ConfigModel = await getModel("Config");
      let systemConfig = await ConfigModel.findOne({ key: "system" });
      if (systemConfig) {
        systemConfig.data = youtube_config;
        await systemConfig.save();
      } else {
        await ConfigModel.create({
          key: "system",
          data: youtube_config,
        });
      }
      res.send({ result: "update " + modelName + " ok", success: true });
    }
  } catch (e) {
    console.log("error", "update " + modelName + " err: ", e);
    res.send({ err: e });
  }
});

router.get("/update", async function (req, res) {
  try {
    console.log("chay vao day khong");
    let updateConfig = req.query.config;
    if (!updateConfig.trace_names_ex) {
      updateConfig.trace_names_ex = [];
    }
    Object.assign(youtube_config, updateConfig);
    if (typeof updateConfig === "object") {
      let ConfigModel = await getModel("Config");
      let systemConfig = await ConfigModel.findOne({ key: "system" });
      if (systemConfig) {
        systemConfig.data = updateConfig;
        await systemConfig.save();
      } else {
        await ConfigModel.create({
          key: "system",
          data: updateConfig,
        });
      }
      res.send({ result: "update " + modelName + " ok" });
    }
  } catch (e) {
    console.log("error", "update " + modelName + " err: ", e);
    res.send({ err: e });
  }
});

router.get("/", async function (req, res) {
  try {
    let configKey = req.query.key;

    const Config = getModel("Config");
    const config = await Config.findOne({ key: configKey });

    res.status(200).json({ data: config });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

router.get("/get-config-by-key", async function (req, res) {
  try {
    let configKey = req.query.key;
    let configData = youtube_config[configKey];
    res.send({ data: configData });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

router.get("/update-vm", async function (req, res) {
  try {
    let vmName = req.query.vm_name;
    updateVmFlag.push({ vm_name: vmName, updated: 0 });

    vmRunnings.forEach((vm) => {
      if (updateVmFlag.some((_vm) => _vm.vm_name == vm.vm_name)) {
        vm.updated = false;
      }
    });

    res.send({ success: true });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

router.get("/cancel-update-vm", async function (req, res) {
  try {
    let vmName = req.query.vm_name;
    updateVmFlag = updateVmFlag.filter((_vm) => _vm.vm_name != vmName);

    res.send({ success: true });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

// Endpoint mới để reset danh sách máy đã cài
router.post("/reset-brave-installations", async function (req, res) {
  try {
    const BraveInstallation = getModel("BraveInstallation");
    await BraveInstallation.deleteMany({});
    res.json({
      success: true,
      message: "All Brave installation records have been reset",
    });
  } catch (error) {
    console.error("Error resetting Brave installation records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint để lấy danh sách các máy đã cài đặt
router.get("/brave-installations", async function (req, res) {
  try {
    const BraveInstallation = getModel("BraveInstallation");
    const installations = await BraveInstallation.find({});
    const totalInstallations = await BraveInstallation.countDocuments({
      isInstalled: true,
    });

    res.json({ success: true, installations, totalInstallations });
  } catch (error) {
    console.error("Error fetching Brave installation records:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/add-country", async function (req, res) {
  try {
    const countries = await getModel("Country").create(req.body.countries);
    res.send({ success: true, data: countries });
  } catch (e) {
    console.log(" err: ", e);
    res.send({ err: e });
  }
});

module.exports = express.Router().use(router);
