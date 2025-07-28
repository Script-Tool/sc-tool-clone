const redis = require("../src/redis-server/redis");
const CONFIG = require("../config/config");
global.newProfiles = [];
global.okProfiles = [];

module.exports = {
  PROFILE_STATUS: {
    NOT_SUBABLE: -1,
    NEED_READING: 0,
    NEED_PLAYLIST: 1,
    SUBABLE: 2,
  },
  // Lấy profile mới
  getNewProfile: async function (vmID) {
    let ProfileModel = await getModel("Profile");
    try {
      const query = {
        status: "NEW",
        is_disabled: { $ne: true },
      };

      // Hàm lấy ngẫu nhiên một profile từ cơ sở dữ liệu
      async function getRandomProfile() {
        const count = await ProfileModel.countDocuments(query);
        const randomIndex = Math.floor(Math.random() * count);
        return await ProfileModel.findOne(query)
          .skip(randomIndex)
          .select("-executed_services -createdAt -updatedAt -__v");
      }

      let newProfile = await getRandomProfile();

      if (!newProfile) {
        // Nếu không tìm thấy profile mới, cập nhật các profile RESET thành NEW và thử lại
        await ProfileModel.updateMany({ status: "RESET" }, { status: "NEW" });
        newProfile = await getRandomProfile();
      }

      if (!newProfile && youtube_config.renew_for_suspend !== false) {
        // Nếu vẫn không tìm thấy profile và cho phép renew profile SUSPEND, cập nhật các profile SUSPEND thành NEW và thử lại
        await ProfileModel.updateMany({ status: "SUSPEND" }, { status: "NEW" });
        newProfile = await getRandomProfile();
      }

      if (newProfile) {
        // Nếu tìm thấy profile mới, cập nhật trạng thái và một số trường khác
        await newProfile.updateOne({
          status: "SYNCING",
          total_bat: 0,
          is_disabled_ads: false,
          count_brave_rounds: 0,
        });
        return newProfile;
      }

      return {};
    } catch (error) {
      console.error("Get new profile error:", error);
    }
  },

  getNewProfiles: async function () {
    let ProfileModel = await getModel("Profile");
    try {
      // if(newProfiles.length >0) return
      // let sql = 'select id, email, password, recover_mail, recover_phone, status, proxy from profile_email where status = "NEW" order by proxy desc'
      // const [rows, fields] = await db.execute(sql)
      // newProfiles = await ProfileModel.find({status: 'NEW'})
    } catch (e) {
      console.log("error", "getNewProfiles err: ", e);
    }
  },

  updateProfileStatus: async function (
    pid,
    vmId,
    status,
    description,
    channels,
    newPassword,
    newRecoverMail,
    gmailCreateYear,
    channelId,
    channelCreateYear
  ) {
    try {
      if (!pid) return;
      let Profile = await getModel("Profile");
      await Profile.updateOne(
        { id: pid },
        {
          status,
          description,
        }
      );

      // if(status == 'SYNCED' || status == 'NEW'){
      //     //let sql = 'update profile_email set vm_id=?, status = ?, description = ? where id = ?'
      //     //const [rows, fields] = await db.execute(sql,[vmId,status,description,pid])
      // }
      // else if(status == 'CHANGED' || status == 'CHANGE_ERROR' || status == 'CHANGING'){
      //    // await db.execute('update profile_email set status = ?, new_description = ?, new_password = ?, new_recovery_mail = ?, gmail_create_year = ?, channel_id = ?, channel_create_year = ?, channel_sub = ?, channel_video = ?, channel_view = ? where id = ?',
      //       //  [status, description, newPassword, newRecoverMail, gmailCreateYear, channelId, channelCreateYear, channelCreateYear?0:null, channelCreateYear?0:null, channelCreateYear?0:null, pid])
      // }
      // else{
      //     //console.log('updateProfileStatus:',pid,status)
      //    // const [rows, fields] = await db.execute('update profile_email set vm_id = ?, status = ?, description = ? where id = ?',[vmId,status,description,pid])
      //     //await db.execute('update proxy set profiles = profiles - 1 where id = (select proxy from profile_email where id = ?)',[pid])
      // }
      // await this.updateProfileChannels(pid, status, channels)
      return { success: true };
    } catch (e) {
      console.log("error", "updateProfileStatus err: ", e);
      throw e;
    }
  },

  deleteAllProfile: async function () {
    let ProfileModel = await getModel("Profile");
    try {
      await ProfileModel.deleteMany({});
      //const [rows, fields] = await db.execute('DELETE FROM profile_email')
      newProfiles = [];
      return 1;
    } catch (e) {
      console.log("error", "delete profile error: ", e);
      return 0;
    }
  },
};
