const os = require("os");
const currentUser = os.userInfo().username;
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { createVideoFromImageAndAudio, mergeAudioFiles, getAudioDuration } = require("./createVideo-aac");

// Hàm tải xuống file từ URL
async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      
      writer.on('finish', () => {
        resolve(outputPath);
      });
      
      writer.on('error', (err) => {
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

async function handleMergeVideo(action) {
  try {
    const { audioLinks, imageLink, folderId } = action;
    
    // Tạo thư mục để lưu các file tạm
    const tempDir = ensureDirectoryExists(path.join("/home", currentUser, "Downloads"));
    const downloadDir = ensureDirectoryExists(path.join("/home", currentUser, "Downloads"));
    
    // Đường dẫn cho các file output
    const videoPath = path.join(downloadDir, `output_${folderId}.mp4`);
    const mergedAudioPath = path.join(tempDir, "merged.aac");
    const imagePath = path.join(tempDir, "image.jpg");
    
    await downloadFile(imageLink, imagePath);
    
    // Tải tất cả các file âm thanh
    const downloadedAudioPaths = [];
    
    for (let i = 0; i < audioLinks.length; i++) {
      const audioUrl = audioLinks[i];
      const audioPath = path.join(tempDir, `audio_${i}.aac`);
      await downloadFile(audioUrl, audioPath);
      downloadedAudioPaths.push(audioPath);
    }
    
    // Ghép các file âm thanh nếu có nhiều hơn 1 file
    let finalAudioPath;
    
    if (downloadedAudioPaths.length > 1) {
      await mergeAudioFiles(downloadedAudioPaths, mergedAudioPath);
      finalAudioPath = mergedAudioPath;
    } else {
      finalAudioPath = downloadedAudioPaths[0];
    }
    
    // Lấy thời lượng của file âm thanh
    const audioDuration = await getAudioDuration(finalAudioPath);
    
    // Tạo video từ ảnh và âm thanh
    await createVideoFromImageAndAudio(
      imagePath, 
      finalAudioPath, 
      videoPath, 
      audioDuration
    );
    
    // Trả về đường dẫn đến video đã tạo
    // Dọn dẹp các file tạm (tùy chọn)
    // Có thể giữ lại tempDir nếu cần thiết
    
    return {
      status: "success",
      videoPath: videoPath,
      duration: audioDuration
    };
    
  } catch (error) {
    console.error("Lỗi trong quá trình xử lý:", error);
    return {
      status: "error",
      message: error.message,
      stack: error.stack
    };
  }
}

module.exports = handleMergeVideo;