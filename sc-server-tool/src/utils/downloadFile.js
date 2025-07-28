const { default: axios } = require("axios");
const fs = require("fs");

// Helper function to download the file
module.exports.downloadFile = async (url, savePath) => {
  const response = await axios({
    method: "get",
    url,
    responseType: "stream",
  });

  const writer = fs.createWriteStream(savePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};
