const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "tmp/csv/" });
const csv = require("fast-csv");
const fs = require("fs");
const router = express.Router();
const path = require('path');


router.get('/export-apikeys', async (req, res) => {
  try {
    const ApiKeyModel = await getModel('APIKey');
    const noDelete = req.query.no_delete;

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

      if (!noDelete) {
        await ApiKeyModel.deleteMany({});
      }

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

module.exports = router;
