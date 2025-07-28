const express = require("express");
var router = express.Router();

router.post("/", async function (req, res) {
  try {
    const Account = await getModel("Account");
    let data = req.body;

    if (data && data.username) {
      if (data.type == "gmail") {
        if (data.reg_ga_success) {
          await Account.updateOne(
            { username: data.username },
            { note: "ga_ads" }
          );
          return res.json({ success: true });
        }
      } else if (youtube_config.new_account_type == "facebook") {
        await Account.deleteOne({ username: data.username });
      }

      await Account.create(data);
      return res.json({ success: true });
    }

    res.send({});
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

router.post("/save-chatgpt-account", async function (req, res) {
  const { id, ...data } = req.body;
  try {
    const ChatgptProfile = await getModel("ChatgptProfile");

    await ChatgptProfile.create(data);

    return res.json({ success: true });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

module.exports = router;
