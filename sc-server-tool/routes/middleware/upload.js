const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./public/images";
    fs.access(uploadDir, fs.constants.F_OK, (err) => {
      if (err) {
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
          if (err) {
            cb(err);
          } else {
            cb(null, uploadDir);
          }
        });
      } else {
        cb(null, uploadDir);
      }
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
