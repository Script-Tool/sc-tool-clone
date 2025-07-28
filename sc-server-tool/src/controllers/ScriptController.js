const ScriptService = require("../services/ScriptService.js");
const ServiceService = require("../services/service-service.js");

class ScriptController {
  static async getNew(req, res) {
    try {
      const result = await ScriptService.getNewScript(req.query.pid);
      res.send(result);
    } catch (e) {
      console.error("update-channel err: ", e);
      res.status(500).send({ err: e.message });
    }
  }

  static async handleReport(req, res) {
    try {
      const { _id: serviceId, pid, email, status, data_reported } = req.query;

      if (!serviceId) {
        return res.send({ success: false, error: "Missing service id" });
      }

      const result = await ServiceService.processReport(
        serviceId,
        pid,
        email,
        status,
        data_reported
      );

      res.send({ success: true });
    } catch (e) {
      console.error("Report processing error:", e);
      res.send({ success: false, error: "Internal server error" });
    }
  }

  static async getNewAudio(req, res) {
    try {
      const Service = await getModel("Service");

      // Tìm service thỏa mãn các điều kiện
      const result = await Service.findOne({
        script_code: "ai_create_video",
        $or: [{ remaining: { $gt: 1 } }, { remaining: -1 }],
        $and: [
          {
            $expr: {
              $and: [
                { $ne: ["$data", null] },
                { $ne: ["$data", ""] },
                {
                  $not: {
                    $regexMatch: {
                      input: "$data",
                      regex: "audioLink",
                    },
                  },
                },
              ],
            },
          },
        ],
      })
        .select("_id data id") // Chỉ lấy 3 trường cần thiết
        .lean(); // Chuyển kết quả thành plain object để tối ưu performance

      // Kiểm tra kết quả
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy service phù hợp",
        });
      }

      // Parse data, thêm audioLink và update
      try {
        let serviceData = JSON.parse(result.data);
        serviceData.audioLink = "";

        // Update service với data mới
        await Service.updateOne(
          { _id: result._id },
          {
            $set: {
              data: JSON.stringify(serviceData),
            },
          }
        );

        // Cập nhật lại result.data để trả về
        result.data = JSON.stringify(serviceData);
      } catch (parseError) {
        console.error("Parse data error:", parseError);
        return res.status(500).json({
          success: false,
          message: "Lỗi xử lý dữ liệu service: " + parseError.message,
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("getNewAudio error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message,
      });
    }
  }

  static async updateAudioLink(req, res) {
    try {
      const { serviceId } = req.params;
      const { audioLink, processingTime } = req.body;

      if (!serviceId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu service ID",
        });
      }

      if (audioLink === undefined) {
        return res.status(400).json({
          success: false,
          message: "Thiếu audioLink trong request body",
        });
      }

      const Service = await getModel("Service");
      const service = await Service.findOne({
        _id: serviceId,
        script_code: "ai_create_video",
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy service",
        });
      }

      // Parse và update data
      try {
        let serviceData = JSON.parse(service.data);
        serviceData.audioLink = audioLink;
        serviceData.processingTime = processingTime;

        await Service.updateOne(
          { _id: serviceId },
          {
            $set: {
              data: JSON.stringify(serviceData),
            },
          }
        );

        res.json({
          success: true,
          message: "Đã cập nhật audioLink thành công",
        });
      } catch (parseError) {
        console.error("Parse data error:", parseError);
        return res.status(500).json({
          success: false,
          message: "Lỗi xử lý dữ liệu service: " + parseError.message,
        });
      }
    } catch (error) {
      console.error("updateAudioLink error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server: " + error.message,
      });
    }
  }
}

module.exports = ScriptController;
