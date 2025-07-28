const express = require("express");
var router = express.Router();


// api để thêm youtube key từ tool
router.post("/add-youtube-key", async function(req, res) {
  let data = req.body;
  try {
    let ApiKeyModel = getModel("APIKey");
    await ApiKeyModel.create({
      key: data.youtube_key,
      type: "youtube_api"
    });
    return res.send({ success: true })
  } catch (error) {
    console.log("error");
    return res.send({ success: false })
  }

});

module.exports = express.Router().use(router);
