const express = require("express");
const getVideosAndViews = require("../../src/utils/getVideosAndViews");
const ScriptController = require("../../src/controllers/ScriptController");
var router = express.Router();

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

router.get("/get-system-script", async function (req, res) {
  let ProfileModel = await getModel("Profile");
  let disabledProfile = await ProfileModel.findOne({
    is_disabled: true,
    updatedAt: {
      // 5 minutes ago (from now)
      $lt: new Date(Date.now() - 1000 * 60 * 5),
    },
  });
  if (disabledProfile) {
    await disabledProfile.updateOne({ total_created_users: 1 });

    let data = {
      script_code: "profile_pause",
      id: "profile_pause",
      pid: disabledProfile.id,
    };

    data = Object.assign(disabledProfile.toObject(), data);
    return res.send(data);
  }
  return res.send({});
});

router.get("/get-new", ScriptController.getNew);

router.get("/get-new-audio", ScriptController.getNewAudio);

router.put("/service/:serviceId/audio", ScriptController.updateAudioLink);

router.get("/report", ScriptController.handleReport);

router.post("/report-fb-group", async function (req, res) {
  try {
    let groupLink = req.body.group_link;
    let fbTopicCode = req.body.fb_topic_code;

    let setCode = fbTopicCode || "khong_xac_dinh";

    let set = await getModel("FBGroupSet").findOne({ code: setCode });
    if (!set) {
      if (setCode != "khong_xac_dinh") {
        set = await getModel("FBGroupSet").findOne({ code: "khong_xac_dinh" });
      }

      if (!set) {
        set = await getModel("FBGroupSet").create({
          name: "Không xác định",
          code: "khong_xac_dinh",
        });
      }
    }

    if (groupLink) {
      if (groupLink.startsWith("PAGE_")) {
        async function checkAndCreatePage(data) {
          let ex = await getModel("FBPage").findOne({ link: data.link });
          if (!ex) {
            getModel("FBPage").create({
              link: data.link,
              name: data.name,
              set_code: set.code,
              set_id: set._id,
            });
          }
        }

        groupLink = groupLink.replace("PAGE_", "");
        let groupLinkData = JSON.parse(groupLink);
        for await (let group of groupLinkData) {
          checkAndCreatePage(group);
        }
      } else if (groupLink.startsWith("PID_")) {
        groupLink = groupLink.replace("PID_", "");
        let groupLinkData = groupLink.split(",");
        for (let group of groupLinkData) {
          let ex = await getModel("FBProfile").findOne({ fb_id: group });
          if (!ex) {
            getModel("FBProfile").create({
              fb_id: group,
              set_code: set.code,
              set_id: set._id,
            });
          }
        }
      } else {
        if (groupLink.startsWith("NEW_")) {
          async function checkAndCreateGroup(data) {
            let ex = await getModel("FBGroup").findOne({ link: data.link });
            if (!ex) {
              getModel("FBGroup").create({
                link: data.link,
                name: data.name,
                set_code: set.code,
                set_id: set._id,
              });
            }
          }

          groupLink = groupLink.replace("NEW_", "");
          let groupLinkData = JSON.parse(groupLink);
          for await (let group of groupLinkData) {
            checkAndCreateGroup(group);
          }
        } else if (groupLink.startsWith("DELETE_")) {
          groupLink = groupLink.replace("DELETE_", "");
          await getModel("FBGroup").deleteOne({ link: groupLink });
        } else {
          await getModel("FBGroup").updateOne(
            { link: groupLink },
            { status: false }
          );
        }
      }
    }
    res.send({ success: true });
  } catch (error) {
    console.log(error);
    res.send({ success: false });
  }
});

module.exports = router;
