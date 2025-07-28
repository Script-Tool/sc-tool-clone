const express = require("express");
var router = express.Router();

router.get("/report", async function (req, res) {
  try {
    if (req.query.vm_id) {
      let vmRunning = vmRunnings.find((vm) => vm.vm_id == req.query.vm_id);
      if (vmRunning) {
        vmRunning.updatedAt = Date.now();
        vmRunning.running = Number(req.query.running) || 0;
        vmRunning.pids = req.query.pids ? req.query.pids.split(",") : [];
        vmRunning.IP = req.ip;

        if (removingProfiles.length) {
          // Chuyển đổi tất cả các pid trong vmRunning.pids thành số
          vmRunning.pids = vmRunning.pids.map((i) => Number(i));

          for (let removingProfile of removingProfiles) {
            // Kiểm tra nếu pid trong vmRunning.pids
            if (vmRunning.pids.includes(Number(removingProfile.id))) {
              // Lưu thông tin profile đang xóa
              const profileToRemove = { ...removingProfile };

              // Loại bỏ profile khỏi danh sách đang xóa
              removingProfiles = removingProfiles.filter(
                (p) => p.id !== removingProfile.id
              );

              //   loại bỏ khỏi vmRunnings đển tránh chuyển sang SYNCED : appMonitor
              if (profileToRemove.type == "NEW") {
                // Nếu type là NEW, loại bỏ profile khỏi tất cả VM (bao gồm cả VM hiện tại)
                // Xóa khỏi VM hiện tại (đã có trong vmRunning.pids ở trên)
                vmRunning.pids = vmRunning.pids.filter(
                  (pid) => Number(pid) !== profileToRemove.id
                );
              }
              // Trả về cả id và type của profile cần xóa
              return res.send({
                removePid: profileToRemove.id,
                removeType: profileToRemove.type || "NEW", // Mặc định là NEW nếu không có type
              });
            }
          }
        }

        if (flagForResetProfiles) {
          return res.send({ reset_all_profiles: true });
        }
      } else {
        if (removingProfiles.length) {
          const listProfile = req.query.pids ? req.query.pids.split(",") : [];

          // Chuyển đổi listProfile thành mảng số để so sánh chính xác hơn
          const numericProfileIds = listProfile.map((id) => Number(id));

          for (let removingProfile of removingProfiles) {
            const profileId = Number(removingProfile.id);

            // Kiểm tra nếu profileId nằm trong danh sách
            if (numericProfileIds.includes(profileId)) {
              // Loại bỏ profile khỏi danh sách đang xóa
              removingProfiles = removingProfiles.filter(
                (p) => p.id !== profileId
              );

              console.log(
                `Đang xóa profile: ${profileId}, loại: ${
                  removingProfile.type || "NEW"
                }`
              );

              // Trả về thông tin profile cần xóa
              return res.send({
                removePid: profileId,
                removeType: removingProfile.type || "NEW", // Mặc định là NEW nếu không có type
              });
            }
          }
        }

        vmRunnings.push({
          vm_id: req.query.vm_id,
          vm_name: req.query.vm_name,
          updatedAt: Date.now(),
          running: Number(req.query.running) || 0,
          pids: req.query.pids ? req.query.pids.split(",") : [],
          updated: true,
          IP: req.ip,
        });
      }
    }
    return res.send({ success: true });
  } catch (e) {
    console.log("error", "update-vm-status err: ", e);
    res.send({ error: true });
  }
});

// Route để kiểm tra cập nhật
router.get("/get-to-update", function (req, res, next) {
  const { vmId } = req.query;
  const data = {};

  if (vmRunnings.some((vm) => vm.vm_id == vmId && !vm.updated)) {
    data.upgradeTool = true;
  }

  if (flagForResetProfiles) {
    data.resetAllItem = true;
  }

  res.send(data);
});

module.exports = router;
