const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
const fs = require("fs");
const path = require("path");

/**
 * Ghép các file .aac thành 1 file mp3 (có re-encode)
 * @param {string[]} inputFiles - Mảng đường dẫn file .aac
 * @param {string} outputFile - Tên file output .mp3
 * @returns {Promise<void>}
 */
function mergeAACtoMP3(inputFiles, outputFile) {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = ffmpeg();

    inputFiles.forEach((file) => {
      ffmpegCommand.input(path.resolve(file));
    });

    ffmpegCommand
      .on("end", () => {
        console.log("✅ Ghép thành công:", outputFile);
        resolve();
      })
      .on("error", (err) => {
        console.error("❌ Lỗi:", err.message);
        reject(err);
      })
      .mergeToFile(outputFile, "./temp") // thư mục tạm để xử lý
      .audioCodec("libmp3lame") // encode lại sang MP3
      .outputOptions("-q:a 2"); // chất lượng MP3 tốt (0 = tốt nhất, 9 = thấp nhất)
  });
}

/**
 * Ghép một ảnh và một audio thành video MP4.
 * @param {string} imagePath - Đường dẫn đến ảnh (jpg/png).
 * @param {string} audioPath - Đường dẫn đến audio (mp3/aac...).
 * @param {string} outputPath - Tên file video đầu ra (mp4).
 * @returns {Promise<void>}
 */

function combineImageAndAudio(imagePath, audioPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    const fs = require("fs");

    // Kiểm tra file
    if (!fs.existsSync(imagePath)) {
      return reject(new Error(`Không tìm thấy file ảnh: ${imagePath}`));
    }
    if (!fs.existsSync(audioPath)) {
      return reject(new Error(`Không tìm thấy file audio: ${audioPath}`));
    }

    // Tùy chọn mặc định
    const defaultOptions = {
      width: 1280,
      height: 720,
      framerate: 25,
      videoBitrate: "1000k",
      audioBitrate: "128k",
      audioSampleRate: 44100,
      videoCodec: "libx264",
      audioCodec: "aac",
      preset: "medium", // ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
    };

    const config = { ...defaultOptions, ...options };

    console.log("🎬 Bắt đầu tạo video với cấu hình:", config);

    let command = ffmpeg()
      .addInput(imagePath)
      .inputOptions(["-loop 1", `-framerate ${config.framerate}`])
      .addInput(audioPath);

    // Thêm filter video để xử lý kích thước
    const videoFilter = `scale=${config.width}:${config.height}:force_original_aspect_ratio=decrease,pad=${config.width}:${config.height}:(ow-iw)/2:(oh-ih)/2`;

    command = command.outputOptions([
      "-shortest",
      `-c:v ${config.videoCodec}`,
      `-c:a ${config.audioCodec}`,
      "-pix_fmt yuv420p",
      `-vf ${videoFilter}`,
      `-r ${config.framerate}`,
      `-b:v ${config.videoBitrate}`,
      `-b:a ${config.audioBitrate}`,
      "-ac 2",
      `-ar ${config.audioSampleRate}`,
      `-preset ${config.preset}`,
      "-movflags +faststart",
    ]);

    command
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("🚀 FFmpeg command:", commandLine);
        console.log("⏳ Đang xử lý video...");
      })
      .on("end", () => {
        console.log("✅ Đã tạo video thành công:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ Lỗi FFmpeg:", err.message);
        reject(err);
      })
      .run();
  });
}

module.exports.createVideo = { mergeAACtoMP3, combineImageAndAudio };
