const defaultScriptsData = require("../../config/defaultScriptsData");

/**
 * Tạo hoặc cập nhật một script trong cơ sở dữ liệu dựa trên dữ liệu cung cấp.
 * Nếu script có mã 'end_script' hoặc 'create_fb_page', kiểm tra và tạo dữ liệu liên quan trong ServiceModel.
 *
 * @param {Object} script - Đối tượng script cần được tạo hoặc cập nhật.
 */
async function createOrUpdateScript(script) {
  let ServiceModel = getModel("Service");
  let ScriptModel = getModel("Script");

  let existingScript = await ScriptModel.findOne({ code: script.code });

  if (existingScript) {
    return existingScript.updateOne(script);
  } else {
    try {
      const createdScript = await ScriptModel.create({
        ...script,
        default_service_data: JSON.parse(script.example_data),
        status: false
      });

      // Xử lý đặc biệt cho các script có mã 'end_script' hoặc 'create_fb_page'
      if (["end_script", "create_fb_page"].includes(createdScript.code)) {
        let firstService = await ServiceModel.findOne({
          script_code: createdScript.code
        });
        if (!firstService) {
          await ServiceModel.create({
            script_code: createdScript.code,
            data: JSON.stringify(createdScript.default_service_data)
          });
        }
      }
    } catch (error) {
        console.log("Error while creating script", error, script)
    }
  }
}

/**
 * Khởi tạo và cập nhật các script từ defaultScriptsData.
 * Hàm này sẽ xử lý mỗi script một cách song song để tối ưu hiệu suất.
 */
async function initializeScripts() {
  let ScriptModel = getModel("Script");

  const scriptPromises = defaultScriptsData.map(script =>
    createOrUpdateScript(script)
  );
  await Promise.all(scriptPromises);
  await ScriptModel.initPosition(); // Cập nhật vị trí của các script sau khi khởi tạo.
}

module.exports = initializeScripts;
