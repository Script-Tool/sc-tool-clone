const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const path = require("path");

const credentialPath = path.resolve(workingDir, "src/config/credentials.json");

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/drive",
  keyFile: credentialPath,
});

const drive = google.drive({ version: "v3", auth });

const downloadFile = async (realFileId, filePath) => {
  const fileId = realFileId;

  try {
    const dest = fs.createWriteStream(filePath);
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

module.exports = downloadFile;
