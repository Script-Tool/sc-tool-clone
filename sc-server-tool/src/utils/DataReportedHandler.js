const e = require("express");
const { SCRIPT_CODES } = require("./constants.js");
const getVideosAndViews = require("./getVideosAndViews");

class DataReportedHandler {
  static async handle(service, dataReported, pid, email, updateOperations) {
    if (dataReported.startsWith("check_recovery")) {
      await this.handleCheckRecovery(dataReported, pid, email);
    } else if (dataReported.startsWith("p_")) {
      await this.handleProfileUpdate(dataReported, pid, email);
    }

    if (service.script_code === SCRIPT_CODES.ADD_VIDEO_PLAYLIST) {
      await this.handleAddVideoPlaylist(service, dataReported);
    }
  }

  static async handleCheckRecovery(dataReported, pid, email) {
    const updateCheck = {};
    if (dataReported.startsWith("check_recovery_success")) {
      const [description, recoverMail] = dataReported.split(":");
      updateCheck.recover_mail = recoverMail;
      updateCheck.description = description;
    } else {
      updateCheck.description = dataReported;
    }

    const Profile = await getModel("Profile");
    const query = pid ? { id: pid } : { email };
    await Profile.updateMany(query, updateCheck);
  }

  static async handleProfileUpdate(dataReported, pid, email) {
    const updateProfile = { description: dataReported };
    const Profile = await getModel("Profile");

    if (dataReported.startsWith("p_success_reco_mail")) {
      const [description, recoverMail] = dataReported.split(":");
      updateProfile.recover_mail = recoverMail;
      updateProfile.description = description;
    } else if (dataReported.startsWith("p_verified")) {
      await this.handleVerifiedProfile(updateProfile, dataReported, pid, email);
    }

    const query = pid ? { id: pid } : { email };
    await Profile.updateMany(query, updateProfile);
  }

  static async handleVerifiedProfile(updateProfile, dataReported, pid, email) {
    updateProfile.verified = true;
    const [, recoEmail] = dataReported.split(":");

    if (recoEmail) {
      updateProfile.recover_mail = recoEmail;
      await this.updateRecoveryEmail(recoEmail, pid);
    }
  }

  static async updateRecoveryEmail(recoEmail, pid) {
    const Profile = await getModel("Profile");
    const bulkOps = [];

    if (pid) {
      const currentP = await Profile.findOne(
        { id: pid },
        "recover_mail"
      ).lean();
      if (currentP) {
        bulkOps.push({
          updateOne: {
            filter: { id: pid },
            update: {
              $set: {
                old_recover_mail: currentP.recover_mail,
                recover_mail: recoEmail,
              },
            },
          },
        });
      }
    }

    const recoProfile = await Profile.findOne(
      { email: recoEmail },
      "id"
    ).lean();
    if (recoProfile) {
      global.wait_code[recoProfile.id] = -1;
    }

    bulkOps.push({
      updateMany: {
        filter: { email: recoEmail },
        update: { $set: { used_for_recovery: 2 } },
      },
    });

    await Profile.bulkWrite(bulkOps);
  }

  static async handleAddVideoPlaylist(service, dataReported) {
    const currentVideosAndViews = getVideosAndViews(dataReported);
    const { total_video, total_view } = currentVideosAndViews;

    if (total_video || total_view) {
      const PlaylistJCT = await getModel("PlaylistJCT");
      const serviceData = JSON.parse(service.data);

      if (serviceData?.playlist_url) {
        await PlaylistJCT.updateOne(
          { url: serviceData.playlist_url },
          {
            $set: {
              total_video,
              total_view: Number(total_view),
              tag: service.note,
            },
          }
        );
      }
    }
  }
}

module.exports = DataReportedHandler;
