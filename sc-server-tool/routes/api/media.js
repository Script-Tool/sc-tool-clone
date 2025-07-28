const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Cấu hình multer để lưu trữ ảnh tải lên, kiểm tra và tạo thư mục nếu cần
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./public/images";

    // Kiểm tra xem thư mục đã tồn tại chưa
    fs.access(uploadDir, fs.constants.F_OK, (err) => {
      if (err) {
        // Nếu chưa tồn tại, tạo thư mục
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
          if (err) {
            cb(err); // Báo lỗi nếu không thể tạo thư mục
          } else {
            cb(null, uploadDir); // Lưu ảnh vào thư mục vừa tạo
          }
        });
      } else {
        cb(null, uploadDir); // Lưu ảnh vào thư mục đã tồn tại
      }
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Hàm lấy ảnh theo tên
async function getImageByName(imageName) {
  console.log("imageName", imageName);
  const Image = getModel("Image");
  const image = await Image.findOne({ name: imageName });
  if (!image) {
    throw new Error("Image not found");
  }
  return image;
}

/**
 * Danh sách api tải ảnh lên và lấy ảnh về
 *
 */

router.get("/random-image", async function (req, res) {
  try {
    let file = "";
    let folderImagePath = "./public/images";
    if (fs.existsSync(folderImagePath)) {
      let files = fs.readdirSync(folderImagePath);
      if (files && files.length) {
        file = files[Math.floor(Math.random() * files.length)];
      }
    }

    return res.sendFile(folderImagePath + "/" + file, {
      root: path.join("./"),
    });
  } catch (e) {
    console.log("error", e);
    res.send({ err: e });
  }
});

// API lấy ảnh theo tên
router.get("/images/:name", async function (req, res) {
  try {
    const imageName = decodeURIComponent(req.params.name);
    const image = await getImageByName(imageName);

    // Kiểm tra xem file ảnh có tồn tại hay không
    if (fs.existsSync(image.path)) {
      return res.sendFile(image.path, { root: path.join("./") });
    } else {
      return res.status(404).send({ error: "Image file not found" });
    }
  } catch (e) {
    console.log("error", e);
    if (e.message === "Image not found") {
      res.status(404).send({ error: e.message });
    } else {
      res.status(500).send({ error: e });
    }
  }
});

// Route để xử lý yêu cầu tải lên ảnh
router.post("/upload-image", upload.single("image"), async function (req, res) {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No image uploaded" });
    }
    // Lấy đường dẫn tới ảnh đã tải lên
    const imagePath = req.file.path;

    // Lấy tên tệp tin gốc
    const originalFilename = req.file.originalname;

    // Tạo một đối tượng Image mới từ dữ liệu tải lên
    const imageData = {
      path: imagePath,
      name: originalFilename, // Lưu tên bức ảnh
      datetime: new Date(), // Ngày giờ hiện tại
      type: req.file.mimetype, // Loại tệp tin
      size: req.file.size, // Kích thước tệp tin
      // Thêm các trường khác tùy theo yêu cầu của bạn
    };

    // Lấy Model Image từ hàm getModel
    const Image = getModel("Image");

    // Lưu đối tượng Image vào cơ sở dữ liệu
    const image = await Image.create(imageData);

    // Trả về thông tin ảnh đã lưu
    return res.send(image);
  } catch (e) {
    console.log("error", e);
    res.status(500).send({ error: e });
  }
});

// API lấy danh sách ảnh
router.get("/images", async function (req, res) {
  try {
    const Image = getModel("Image");
    const images = await Image.find();
    return res.send(images);
  } catch (e) {
    console.log("error", e);
    res.status(500).send({ error: e });
  }
});

// API xóa ảnh
router.delete("/images/:id", async function (req, res) {
  console.log("delete");
  try {
    const Image = getModel("Image");
    const imageId = req.params.id;

    // Tìm ảnh theo ID
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).send({ error: "Image not found" });
    }

    // Xóa tệp tin ảnh từ hệ thống tệp tin
    try {
      await fs.promises.unlink(image.path);
    } catch (error) {
      console.log("Không có ảnh trong thư mục");
    }

    // Xóa ảnh khỏi cơ sở dữ liệu
    await Image.findByIdAndDelete(imageId);

    return res.send({ message: "Image deleted successfully" });
  } catch (e) {
    console.log("error", e);
    res.status(500).send({ error: e });
  }
});

module.exports = router;
