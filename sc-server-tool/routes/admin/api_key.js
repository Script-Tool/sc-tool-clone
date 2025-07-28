const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "tmp/csv/" });
const csv = require("fast-csv");
const fs = require("fs");
const router = express.Router();
const path = require('path');

// Lấy model APIKey từ MongoDB

router.get("/delete-all", async function(req, res) {
  try {
    let ApiKeyModel = getModel("APIKey");
    await ApiKeyModel.deleteMany();
    res.send({ success: true });
  } catch (e) {
    res.send({ err: e });
  }
});

router.post("/import", upload.single("file"), function(req, res) {
  try {
    const fileRows = [];

    csv
      .parseFile(req.file.path)
      .on("data", function(data) {
        fileRows.push(data); // push each row
      })
      .on("end", async function() {
        try {
          if (fileRows[0][0].toLowerCase().indexOf("api_key") == 0) {
            fileRows.shift();
          }
          let ApiKeyModel = getModel("APIKey");

          for await (let keyData of fileRows) {
            await ApiKeyModel.create({
              key: keyData[0],
              type: keyData[1] || "youtube_api"
            });
          }
          res.send({ success: true });
        } catch (e) {
          res.send(e);
        }
      })
      .on("error", function(e) {
        console.error("parse profile err:", e);
        res.send(e);
      });
  } catch (e) {
    console.log("insert-profile-email err:", e);
    res.send(e);
  }
});



router.get('/export-apikeys', async (req, res) => {
  try {
    const ApiKeyModel = await getModel('APIKey');

    const apiKeys = await ApiKeyModel.find({});

    if (apiKeys.length) {
      let csvData = 'api_key,type';

      apiKeys.forEach(apiKey => {
        csvData += `\n${apiKey.key},${apiKey.type || 'youtube_api'}`;
      });

      const dir = 'export';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      const filename = `${dir}/apikeys-${Date.now()}.csv`;
      const filePath = path.join(process.cwd(), filename);
      fs.writeFileSync(filePath, csvData);

      return res.download(filePath, `apikeys-${Date.now()}.csv`, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
        fs.unlinkSync(filePath);
      });
    }

    return res.send({ result: true });
  } catch (error) {
    console.log('Error while exporting API keys:', error);
    res.status(500).json({ error: 'Failed to export API keys' });
  }
});

module.exports = express.Router().use(router);
