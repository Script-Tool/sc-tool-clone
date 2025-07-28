/*
 * người viết: Đinh Văn Thành
 * ngày viết: 10/04/2024
 * Chức năng: lấy dữ liệu cho modal config khi truyền key sang
 */

function initializeLoadConfig(key) {
  return new Promise(async (resolve, resreject) => {
    try {
      // load config
      let ConfigModel = getModel("Config");
      if (key == "system") {
        let systemConfig = await ConfigModel.findOne({ key: key });
        youtube_config = systemConfig ? systemConfig.data : {} ;
        if (!youtube_config.percent_view_channel_youtube) {
          youtube_config.percent_view_channel_youtube = [
            50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
            50, 50, 50, 50, 50, 50, 50,
          ];
        }
        resolve(youtube_config)
      }
      if (key == "system-mobile") {
        let systemConfigMobile = await ConfigModel.findOne({
            key: key,
          });
          youtube_config = systemConfigMobile ? systemConfigMobile.data : {} ;
        if (!youtube_config.percent_view_channel_youtube) {
          youtube_config.percent_view_channel_youtube = [
            50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
            50, 50, 50, 50, 50, 50, 50,
          ];
        }
        resolve(youtube_config)
      }
    } catch (error) {
      resreject(error);
    }
  });
}

module.exports = initializeLoadConfig;
