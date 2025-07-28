const express = require("express");
var router = express.Router();

router.get("/reset-profile-on-vm", async function (req, res) {
  try {
    let pid = Number(req.query.id);

    removingProfiles.push({ id: pid, type: req.query.type });

    let Profile = await getModel("Profile");
    await Profile.updateOne({ id: pid }, { total_bat: 0 });
    res.send({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.get("/active-reset-profiles-flag", async function (req, res) {
  try {
    flagForResetProfiles = true;
    setTimeout(() => {
      flagForResetProfiles = false;
    }, 120000);

    res.send({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.get("/cancel-active-reset-profiles-flag", async function (req, res) {
  try {
    flagForResetProfiles = false;
    res.send({ success: true });
  } catch (error) {
    console.log(error);
  }
});

router.post("/update2", async function (req, res) {
  try {
    flagForResetProfiles = false;
    res.send({ success: true });
  } catch (error) {
    console.log(error);
  }
});

// Update profile - the email should come from request body
router.post("/update", async function (req, res) {
  try {
    const { email, topic_content } = req.body;

    // Validate required fields
    if (!email) {
      return res.send({
        success: false,
        message: "Email is required",
      });
    }

    const ProfileModel = getModel("Profile");

    // Find and update profile
    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { email },
      { $set: { topic_content } },
      { new: true }
    );

    if (!updatedProfile) {
      return res.send({
        success: false,
        message: "Profile not found",
      });
    }

    return res.send({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.send({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

// Update profile - the email should come from request body
router.put("/reset-backup-codes", async function (req, res) {
  try {
    const ProfileModel = getModel("Profile");

    // Find and update profile
    const updatedProfile = await ProfileModel.updateMany(
      {},
      { $set: { is_reset_backup_code: true } }
    );

    if (!updatedProfile) {
      return res.send({
        success: false,
        message: "Profile not found",
      });
    }

    return res.send({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.send({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

router.put("/change-2fa", async function (req, res) {
  try {
    const ProfileModel = getModel("Profile");

    // Find and update profile
    const updatedProfile = await ProfileModel.updateMany(
      {},
      { $set: { is_change_2fa: true } }
    );

    if (!updatedProfile) {
      return res.send({
        success: false,
        message: "Profile not found",
      });
    }

    return res.send({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.send({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

router.put("/verify-studio", async function (req, res) {
  try {
    const ProfileModel = getModel("Profile");

    // Find and update profile
    const updatedProfile = await ProfileModel.updateMany(
      {},
      { $set: { verified_studio: 0 } }
    );

    if (!updatedProfile) {
      return res.send({
        success: false,
        message: "Profile not found",
      });
    }

    return res.send({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.send({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

module.exports = express.Router().use(router);
