const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const path = require("path");

const credentialPath = path.resolve(workingDir, "src/config/credentials.json");

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/drive",
  keyFile: credentialPath,
});

async function shareFile(fileId) {
  const service = google.drive({ version: "v3", auth });
  await service.permissions.create({
    fileId: fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });
  console.log("File shared successfully.");
}

async function uploadfile(
  mimetype,
  fileName,
  filePath,
  folderId = "1GSnsDwJdv3K_poDo4DwZ9yMZ1sys5IMx"
) {
  const service = google.drive({ version: "v3", auth });
  const requestBody = {
    name: fileName,
    fields: "id",
    parents: [folderId], // Thêm ID của thư mục cha
  };

  const media = {
    mimeType: mimetype,
    body: fs.createReadStream(filePath),
  };

  try {
    const file = await service.files.create({
      requestBody,
      media: media,
    });
    await shareFile(file.data.id);

    console.log(`https://drive.google.com/file/d/${file.data.id}/view`);
    fs.unlinkSync(filePath);

    return file.data;
  } catch (err) {
    console.log("loi tai tep len", err);
    throw err;
  }
}

async function listFiles() {
  try {
    const service = google.drive({ version: "v3", auth });
    const response = await service.files.list({
      pageSize: 10, // Số lượng tệp muốn liệt kê
      fields: "files(id, name)",
    });

    const files = response.data.files;

    if (files.length === 0) {
      console.log("No files found.");
    } else {
      console.log("Files:", files);

      return files;
    }
  } catch (error) {
    console.error("Error listing files:", error.message);
  }
}

const downloadFile = async (fileId, path) => {
  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.get(
    {
      fileId: fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  const dest = fs.createWriteStream(path);
  console.log(path);

  response.data
    .on("end", () => {
      console.log("ok");
    })
    .on("error", (err) => {
      console.error(err);
    })
    .pipe(dest);
};

const downloadLargeFile = async (realFileId, destinationPath) => {
  const fileId = realFileId;

  try {
    const drive = google.drive({ version: "v3", auth });
    const dest = fs.createWriteStream(destinationPath);
    const res = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "stream" }
    );

    await new Promise((resolve, reject) => {
      let progress = 0;
      res.data
        .on("data", (chunk) => {
          progress += chunk.length;
          const progressInGB = (progress / 1024 ** 3).toFixed(2);
          process.stdout.write(`Downloaded ${progressInGB} GB\r`);
        })
        .on("end", () => {
          console.log("\nDownload complete.");
          resolve();
        })
        .on("error", (err) => {
          console.error("Error downloading file:", err);
          reject(err);
        })
        .pipe(dest);
    });

    return "File downloaded successfully";
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};

async function deleteFile(fileId) {
  const service = google.drive({ version: "v3", auth });
  const deletedFile = await service.files.delete({
    fileId: fileId,
  });

  console.log("File deleted successfully.");
  return deletedFile;
}

module.exports = {
  listFiles,
  uploadfile,
  downloadFile,
  downloadLargeFile,
  deleteFile,
};
