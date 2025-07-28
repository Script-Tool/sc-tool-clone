const express = require("express");
var router = express.Router();
const profile_model = require("../../model/profile_model");

router.get("/get-for-reg-channel", async function (req, res) {
  let Profile = getModel("Profile");
  let Comment = getModel("Comment");
  let pid = Number(req.query.pid);

  if (youtube_config.unsub_youtube) {
    let filter = { status: "NEW" };
    let countRs = await Profile.find(filter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    let profile = await Profile.findOne(filter).skip(randomPosition);

    if (profile) {
      await profile.updateOne({ status: "SYNCING" });

      return res.json({
        ...profile.toObject(),
        script_code: "unsub_youtube",
      });
    }
  } else if (youtube_config.channel_appeal) {
    let filter = { status: "NEW" };
    let countRs = await Profile.find(filter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    let profile = await Profile.findOne(filter).skip(randomPosition);

    if (profile) {
      await profile.updateOne({ status: "SYNCING" });

      return res.json({
        ...profile.toObject(),
        script_code: "channel_appeal",
      });
    }
  } else if (
    youtube_config.is_reg_account &&
    youtube_config.new_account_type == "facebook"
  ) {
    let rs;

    let verify_type = youtube_config.fb_verify_type;
    if (verify_type == "rd") {
      verify_type = ["phone", "gmail"][Math.floor(Math.random() * 2)];
    }

    let zone_name = youtube_config.zone_name;
    if (zone_name == "rd") {
      zone_name = ["vn", "us"][Math.floor(Math.random() * 2)];
    }

    if (verify_type == "phone") {
      rs = {
        zone_name,
        script_code: "reg_account",
        account_type: "facebook",
        verify_type,
      };
    } else {
      let Account = getModel("Account");
      let countRs = await Account.find({ type: "gmail" }).countDocuments();
      let randomPosition = Math.floor(Math.random() * countRs);
      let gmailAcc = await Account.findOne({ type: "gmail" }).skip(
        randomPosition
      );
      if (gmailAcc) {
        rs = {
          zone_name,
          script_code: "reg_account",
          account_type: "facebook",
          email: gmailAcc.username,
          verify_type,
        };
      }
    }

    return res.json(rs);
  } else if (youtube_config.is_reg_account_chatgpt) {
    const Profile = getModel("Profile");
    const randomProfile = await Profile.getRandomProfile({ status: "NEW" });

    return res.json({
      script_code: "reg_account_chatgpt",
      account_type: "hotmail",
      email: randomProfile.email,
      password: randomProfile.password,
    });
  } else if (youtube_config.is_reg_account_elevenlabs) {
    const Profile = getModel("Profile");
    const randomProfile = await Profile.getRandomProfile({ status: "NEW" });

    return res.json({
      script_code: "reg_account_elevenlabs",
      account_type: "hotmail",
      email: randomProfile.email,
      password: randomProfile.password,
    });
  } else if (youtube_config.is_recovery_mail) {
    /**
     * Lấy profiles kháng mail
     */
    let filter = { status: "NEW" };
    if (pid) {
      filter = {
        id: pid,
      };
    }
    let countRs = await Profile.find(filter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    let profile = await Profile.findOne(filter).skip(randomPosition);

    if (profile && profile.status != "ERROR") {
      await profile.updateOne({ status: "SYNCING" });

      let comment = await Comment.getRandomComment("gmail");
      let profileTrash = await Profile.getRandomProfile({ status: "TRASH" });

      if (!profileTrash) {
        return res.status(400).json({
          error: "Thiếu profile trash",
        });
      }
      return res.json({
        ...profile.toObject(),
        comment,
        script_code: "recovery_mail",
        contact_mail: profileTrash?.email || "",
      });
    }
  } else if (youtube_config.is_ver_mail) {
    let filter = { status: "NEW" };
    if (pid) {
      filter = {
        id: pid,
      };
    }
    let countRs = await Profile.find(filter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    let profile = await Profile.findOne(filter).skip(randomPosition);

    if (profile && profile.status != "ERROR") {
      await profile.updateOne({ status: "SYNCING" });
      return res.json({
        ...profile.toObject(),
        script_code: "reg_user",
        is_ver_mail_type: true,
      });
    }
  } else if (
    youtube_config.is_rename_channel &&
    youtube_config.is_rename_channel != "false"
  ) {
    let filter = { status: "NEW" };
    if (pid) {
      filter = {
        id: pid,
      };
    }
    let countRs = await Profile.find(filter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    let profile = await Profile.findOne(filter).skip(randomPosition);

    if (profile && profile.status != "ERROR") {
      await profile.updateOne({ status: "SYNCING" });
      return res.json({
        ...profile.toObject(),
        script_code: "rename_channel",
        is_rename_channel_type: true,
      });
    }
  } else {
    let filter = { status: "NEW" };
    if (pid) {
      filter = {
        id: pid,
      };
    }
    let countRs = await Profile.find(filter).countDocuments();
    let randomPosition = Math.floor(Math.random() * countRs);
    let profile = await Profile.findOne(filter).skip(randomPosition);

    if (!profile) {
      await Profile.updateMany({ status: "RESET" }, { status: "NEW" });
      let countRs2 = await Profile.find(filter).countDocuments();
      let randomPosition2 = Math.floor(Math.random() * countRs2);
      profile = await Profile.findOne(filter).skip(randomPosition2);
    }

    if (profile && profile.status != "ERROR") {
      await profile.updateOne({ status: "SYNCING" });
      return res.json({
        ...profile.toObject(),
        script_code: youtube_config.is_change_pass ? "change_pass" : "reg_user",
      });
    }
  }
  return res.json({});
  // return res.send({
  //   script_code: 'reg_account',
  //   id: Date.now(),
  //   account_type: 'gmail'
  // })
});

router.get("/get-brave-info", async function (req, res) {
  let data = req.query;
  let Profile = await getModel("Profile");
  let profile = await Profile.findOne({ id: data.pid });
  let braveInfo = {};
  if (profile) {
    braveInfo = profile.getBraveInfo();
  }
  res.send(braveInfo);
});

router.get("/info", async function (req, res) {
  let data = req.query;
  let Profile = await getModel("Profile");
  let profile = await Profile.findOne({ id: data.pid });
  res.send(profile);
});

/*
* Người sửa: Đinh Văn Thành
* Ngày sửa: 16-04-2024
* Lý do: thêm trường query email, và cập nhật toàn bộ những data được tìm thấy trong cơ sở dữ liệu với email tương ứng
* Method : POST
* tham só truyền vào: body {
  pid : number ==> trường bắt buộc nếu mà tìm kiếm một profile
  email: string ==> trường bắt buộc nếu mà tìm kiếm nhiều profile theo email cho trước 
  ..v..v..v 
}
*/
router.post("/update-data", async function (req, res) {
  let data = req.body;
  if ((data && data.pid) || (data && data.email)) {
    try {
      let profile;
      let Profile = await getModel("Profile");
      if (data.pid) {
        profile = await Profile.findOne({ id: data.pid });
        if (profile) {
          await updataProfile(profile, data);
          return res.send({ success: true });
        } else {
          return res.send({ error: "Not found profile." });
        }
      } else if (data.email) {
        profile = await Profile.find({ email: data.email });
        if (profile && profile.length > 0) {
          for (let index = 0; index < profile.length; index++) {
            const element = profile[index];
            await updataProfile(element, data);
            if (profile.length - 1 === index) {
              return res.send({ success: true });
            }
          }
        } else {
          return res.send({ error: "Not found profile." });
        }
      }
    } catch (error) {
      return res.send({ error: "Error while update profile data." });
    }
  }
  return res.send({ error: "Missing data." });
});
/*
 * Người viết: Đinh Văn Thành
 * Ngày viết: 16-04-2024
 * Lý do : vì thêm một case mail nữa, mà muốn tái sử dụng được code lên sẽ viết một Hàm để dùng chung
 */
async function updataProfile(profile, data) {
  if (
    data.description &&
    data.description == "#PlusPageName_NOT_FOUND" &&
    data.status == "ERROR"
  ) {
    if (profile.total_created_users < 65) {
      data.status = "RESET";
      data.proxy = 0;
    }
  }
  if (youtube_config.is_fb && ["ERROR", "RESET"].includes(data.status)) {
    data.last_time_reset = Date.now();
  }
  if (data.description == "re_login") {
    data.status = "NEW";
  }
  await profile.updateOne(data);
}
//=============== END =============================

router.post("/update-watched", async (req, res) => {
  const { viewed_ads } = req.body;
  countView++;
  if (viewed_ads && viewed_ads == "true") {
    countAds++;
  }

  res.send({ err: null });
});

router.post("/update-status", async (req, res) => {
  try {
    const { pid, status, vmId } = req.body;
    if (status === "ERROR") {
      await getModel("Profile").updateOne(
        { id: pid },
        { status, last_time_reset: Date.now(), vm_id: vmId }
      );
    }
    res.send({ err: null, success: true });
  } catch (e) {
    console.log("error", "update-status err: ", e);
    res.send({ err: e });
  }
});

// Route handler để lấy profile mới
router.get("/", async function (req, res) {
  try {
    const vmId = req.query.vmId;
    const type = req.query.type || "";
    let profile;

    if (req.query.create_channel_type) {
      // Nếu có tham số create_channel_type, lấy profile mới dựa trên vmId và create_channel_type
      profile = await profile_model.getNewProfile(
        vmId,
        req.query.create_channel_type
      );
    } else {
      if (youtube_config.is_tiktok) {
        // Nếu là TikTok, lấy profile mới dựa trên vmId và type
        profile = await profile_model.getNewProfile(vmId, type);
      } else if (youtube_config.is_fb) {
        // Nếu là Facebook, lấy profile từ danh sách ready_profiles
        const p = ready_profiles.shift();
        const pf = await getModel("Profile").findOne({ id: p });
        if (pf) {
          await pf.updateOne({ status: "SYNCING" });
          profile = pf;
        }

        // Nếu không có profile sẵn sàng, lấy profile mới dựa trên vmId và type
        if (!profile) {
          profile = await profile_model.getNewProfile(vmId, type);
        }
      } else {
        // Lấy profile mới dựa trên vmId và type
        profile = (await profile_model.getNewProfile(vmId, type)) || {};
        if (youtube_config.is_check_mail_1) {
          profile.mail_type = youtube_config.check_mail_1_type;
        }

        if (!profile?.twoFA && profile?.backup_code) {
          const backupCodes = profile.backup_code.split("|");
          profile._doc.backupCode =
            backupCodes[Math.floor(Math.random() * backupCodes.length)];

          await getModel("Profile").updateOne(
            { _id: profile._id },
            {
              backup_code: backupCodes
                .filter((code) => code !== profile._doc.backupCode)
                .join("|"),
            }
          );
        }
      }
    }

    res.send({ err: null, profile: profile });
  } catch (error) {
    console.error("Get new profile error:", error, "Params:", req.query);
    res.send({});
  }
});

module.exports = router;
