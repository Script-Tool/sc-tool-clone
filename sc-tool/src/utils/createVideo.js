const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfprobePath(require("@ffprobe-installer/ffprobe").path);
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);
const path = require("path");
const fs = require("fs");
const textToSpeech = require("../ai/text-to-speed");

const os = require("os");
const utils = require("../../utils");
const currentUser = os.userInfo().username;

function createVideoFromImageAndAudio(
  imagePath,
  audioPath,
  outputPath,
  duration,
  backgroundMusicPath = `/home/${currentUser}/sc-tool/src/file/background_music.mp3`
) {
  return new Promise((resolve, reject) => {
    // Trước tiên, lấy thông tin của ảnh đầu vào để xác định chiến lược xử lý
    ffmpeg.ffprobe(imagePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const { width, height } = metadata.streams[0];
      utils.log(`Ảnh đầu vào có kích thước: ${width}x${height}`);

      // Tính toán tỉ lệ hiện tại của ảnh
      const aspectRatio = width / height;
      const targetRatio = 16 / 9;

      let filterCommand = "";

      if (Math.abs(aspectRatio - targetRatio) < 0.01) {
        // Ảnh đã có tỉ lệ gần với 16:9, chỉ cần scale
        filterCommand = "scale=1920:1080,setsar=1";
      } else if (aspectRatio > targetRatio) {
        // Ảnh quá rộng, cắt chiều rộng
        const newWidth = Math.round(height * targetRatio);
        const xOffset = Math.floor((width - newWidth) / 2);
        filterCommand = `crop=${newWidth}:${height}:${xOffset}:0,scale=1920:1080,setsar=1`;
      } else {
        // Ảnh quá cao, cắt chiều cao
        const newHeight = Math.round(width / targetRatio);
        const yOffset = Math.floor((height - newHeight) / 2);
        filterCommand = `crop=${width}:${newHeight}:0:${yOffset},scale=1920:1080,setsar=1`;
      }

      utils.log(`Áp dụng filter: ${filterCommand}`);

      // Khởi tạo command
      let command = ffmpeg();

      // Thêm input hình ảnh và audio chính
      command.input(imagePath);
      command.input(audioPath);

      // Xử lý khi có nhạc nền
      //       if (backgroundMusicPath && fs.existsSync(backgroundMusicPath)) {
      //         utils.log(`Thêm nhạc nền: ${backgroundMusicPath}`);
      //
      //         // Thêm file nhạc nền
      //         command.input(backgroundMusicPath);
      //
      //         // Sử dụng filter complex để xử lý audio
      //         command.complexFilter([
      //           // Format audio chính
      //           "[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[main]",
      //           // Format nhạc nền, giảm âm lượng xuống 15% và lặp lại
      //           "[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=1,aloop=loop=-1:size=2e+09[bgm]",
      //           // Trộn 2 audio với trọng số ưu tiên cho audio chính
      //           "[main][bgm]amix=inputs=2:duration=first:weights=1 1[aout]"
      //         ]);
      //
      //         // Thiết lập output với filter complex
      //         command
      //           .outputOptions([
      //             "-map 0:v",           // Sử dụng video từ input đầu tiên
      //             "-map [aout]",        // Sử dụng audio đã trộn
      //             "-c:v libx264",       // Codec video
      //             "-pix_fmt yuv420p",
      //             "-preset medium",
      //             "-c:a aac",           // Codec audio
      //             "-b:a 192k",          // Bitrate audio
      //             `-vf ${filterCommand}` // Filter video
      //           ]);
      //       } else {
      // Nếu không có nhạc nền, sử dụng thiết lập đơn giản
      command.outputOptions([
        "-c:v libx264",
        "-pix_fmt yuv420p",
        "-preset medium",
        "-c:a aac",
        "-b:a 192k",
        `-vf ${filterCommand}`,
      ]);
      // }

      // Thiết lập thời lượng và lưu video
      command
        .duration(duration)
        .save(outputPath)
        .on("start", (cmd) => {
          utils.log(`Đang thực thi lệnh: ${cmd}`);
        })
        .on("progress", (progress) => {
          utils.log(`Tiến độ xử lý: ${JSON.stringify(progress)}`);
        })
        .on("end", () => {
          utils.log(`Video đã được tạo thành công: ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (e) => {
          console.error(`Lỗi khi tạo video: ${e.message}`);
          reject(e);
        });
    });
  }).catch((e) => {
    utils.log("loi ghep video", e);
  });
}

async function processLargeTextFile(text, outputPath, voice) {
  try {
    const maxLength = 4096;
    const chunks = splitText(text, maxLength);

    const audioFiles = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkFilename = `chunk_${i}.mp3`;
      await textToSpeech(chunks[i], chunkFilename, voice);
      audioFiles.push(chunkFilename);
    }

    await combineAudioFiles(audioFiles, outputPath);

    // Dọn dẹp các file âm thanh tạm thời
    audioFiles.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    const duration = await getAudioDuration(outputPath);

    return { outputPath, duration };
  } catch (error) {
    utils.log("🚀 ~ processLargeTextFile ~ error:", error);
  }
}

// Hàm lấy duration của file âm thanh
function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration; // Lấy thời lượng (giây)
        utils.log(`Duration of ${filePath}: ${duration} seconds`);
        resolve(duration);
      }
    });
  });
}

// Hàm chia văn bản thành các phần nhỏ
function splitText(text, maxLength) {
  const chunks = [];
  while (text.length > maxLength) {
    const chunk = text.slice(0, maxLength);
    text = text.slice(maxLength);
    chunks.push(chunk);
  }
  chunks.push(text);
  return chunks;
}

// Hàm kết hợp các file âm thanh
function combineAudioFiles(audioFiles, outputFile) {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = ffmpeg();

    // Thêm từng file âm thanh vào lệnh
    audioFiles.forEach((file) => {
      ffmpegCommand.input(file);
    });

    // Đầu ra
    ffmpegCommand
      .on("end", () => {
        utils.log(`Combined audio saved as ${outputFile}`);
        resolve(outputFile);
      })
      .on("error", (err) => {
        console.error("Error combining audio files:", err);
        reject(err);
      })
      .mergeToFile(outputFile, path.dirname(outputFile));
  });
}

function mergeVideos(
  videoPaths,
  outputPath,
  backgroundMusicPath = `/home/${currentUser}/sc-tool/src/file/background_music.mp3`
) {
  return new Promise((resolve, reject) => {
    // Kiểm tra danh sách video
    if (!videoPaths || videoPaths.length === 0) {
      return reject(new Error("Danh sách video trống!"));
    }

    // Tạo tệp danh sách video (dành cho FFmpeg)
    const fileListPath = path.join(__dirname, "file_list.txt");
    const fileContent = videoPaths
      .map((video) => `file '${path.resolve(video)}'`)
      .join("\n");

    fs.writeFileSync(fileListPath, fileContent);

    let cmd = ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0"]);

    // Nếu có nhạc nền
    //     if (backgroundMusicPath && fs.existsSync(backgroundMusicPath)) {
    //       // Thêm nhạc nền
    //       cmd.input(backgroundMusicPath);
    //
    //       // Thêm filter để mix nhạc nền với âm thanh video
    //       // và giảm âm lượng nhạc nền xuống 30%
    //       cmd.complexFilter([
    //         "[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a1]",
    //         "[1:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=0.1,aloop=loop=-1:size=2e+09[a2]",
    //         "[a1][a2]amix=inputs=2:duration=first[aout]",
    //       ]);
    //
    //       // Sử dụng đầu ra của filter complex
    //       cmd.outputOptions([
    //         "-map 0:v",
    //         "-map [aout]",
    //         "-c:v copy",
    //         "-c:a aac",
    //         "-b:a 192k",
    //       ]);
    //     } else {
    // Nếu không có nhạc nền, giữ nguyên thiết lập
    cmd.outputOptions("-c copy");
    // }

    cmd
      .on("start", (command) => {
        utils.log(`Chạy lệnh: ${command}`);
      })
      .on("end", () => {
        // Xóa file danh sách sau khi hoàn thành
        fs.unlinkSync(fileListPath);
        utils.log("Ghép video hoàn tất!");
        resolve(outputPath);
      })
      .on("error", (err) => {
        if (fs.existsSync(fileListPath)) {
          fs.unlinkSync(fileListPath);
        }
        console.error("Lỗi khi ghép video:", err.message);
        reject(err);
      })
      .output(outputPath)
      .run();
  });
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
          "-c:a libmp3lame", // MP3 encoder
          "-q:a 2", // Chất lượng audio
        ])
        .on("start", (cmd) => {
          utils.log("Executing:", cmd);
        })
        .on("progress", (progress) => {
          utils.log("Processing:", progress);
        })
        .on("end", () => {
          utils.log("Merging completed!");
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

module.exports = {
  createVideoFromImageAndAudio,
  processLargeTextFile,
  mergeVideos,
  getAudioDuration,
  mergeAudioFiles,
};
