const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const { default: axios } = require("axios");
const { backblazeAPI } = require("../services/backblazeAPI");

ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

// Hàm tải xuống file từ URL
async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);

      writer.on("finish", () => {
        resolve(outputPath);
      });

      writer.on("error", (err) => {
        console.error(`Lỗi khi tải xuống: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Lỗi khi tải file từ ${url}: ${error.message}`);
    throw error;
  }
}

// Đảm bảo thư mục tồn tại
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

function mergeAudioFiles(audioPaths, outputPath) {
  return new Promise((resolve, reject) => {
    // Sử dụng filter_complex thay vì dùng file list
    let command = ffmpeg();

    try {
      // Kiểm tra các files đầu vào
      audioPaths.forEach((audioPath, index) => {
        if (!fs.existsSync(audioPath)) {
          throw new Error(`File không tồn tại: ${audioPath}`);
        }
        // Thêm từng input vào command
        command = command.input(audioPath);
      });

      command
        .outputOptions([
          // Sử dụng filter_complex để ghép audio
          `-filter_complex concat=n=${audioPaths.length}:v=0:a=1[outa]`,
          "-map [outa]",
        ])
        .outputOptions([
          "-c:a libmp3lame", // Sử dụng encoder MP3
          "-b:a 192k", // Bitrate cho MP3
        ])
        .on("start", (cmd) => {
          console.log("Executing:", cmd);
        })
        .on("progress", (progress) => {
          console.log("Processing:", progress);
        })
        .on("end", () => {
          console.log("Merging completed!");
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("Error:", err.message);
          reject(err);
        })
        .save(outputPath);
    } catch (error) {
      console.error("Initialization error:", error);
      reject(error);
    }
  });
}

// Hàm lấy duration của file âm thanh (hỗ trợ cả .aac)
function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration; // Lấy thời lượng (giây)
        console.log(`Duration of ${filePath}: ${duration} seconds`);
        resolve(duration);
      }
    });
  });
}

async function handleMergeAudio(audioLinks) {
  try {
    const downloadDir = ensureDirectoryExists(
      path.join(process.cwd(), "tmp", "downloads")
    );

    // Đường dẫn cho các file output
    const mergedAudioPath = path.join(downloadDir, "audio.mp3");

    // Tải tất cả các file âm thanh
    const downloadedAudioPaths = [];
    for (let i = 0; i < audioLinks.length; i++) {
      const audioUrl = audioLinks[i];
      const audioPath = path.join(downloadDir, `audio_${i}.mp3`);
      await downloadFile(audioUrl, audioPath);
      downloadedAudioPaths.push(audioPath);
    }

    // merge files
    await mergeAudioFiles(downloadedAudioPaths, mergedAudioPath);

    // Upload files len back blaze
    const fileName = path.basename(
      mergedAudioPath,
      path.extname(mergedAudioPath)
    );

    const backblazeConfig = youtube_config.backblaze;
    const fileResponse = await backblazeAPI.uploadFile(
      mergedAudioPath,
      "d117089e8aaed2c7935e0f16",
      fileName,
      null,
      backblazeConfig
    );

    // Lấy thời lượng của file âm thanh
    const audioDuration = await getAudioDuration(mergedAudioPath);

    // xoa files
    clearDownloadFolder(downloadDir);

    return {
      status: "success",
      audioLink: `${backblazeConfig}/b2api/v1/b2_download_file_by_id?fileId=${fileResponse.fileId}`,
      duration: audioDuration,
    };
  } catch (error) {
    console.error("Lỗi trong quá trình xử lý:", error);
    return {
      status: "error",
      message: error.message,
      stack: error.stack,
    };
  }
}

function clearDownloadFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return;

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath); // xoá file
    }
  }
}

module.exports = { handleMergeAudio };
