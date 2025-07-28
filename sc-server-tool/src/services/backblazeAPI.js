const B2 = require("backblaze-b2");
const fs = require("fs");
const path = require("path");
const { default: axios } = require("axios");
const crypto = require("crypto");

// Khởi tạo B2 với thông tin xác thực từ systemConfig
let b2;
let lastAuthTime = 0;
const AUTH_CACHE_DURATION = 20 * 60 * 1000; // 20 phút cache

// Hàm để khởi tạo B2 với thông tin xác thực
function initializeB2(config) {
  if (!config || !config.applicationKeyId || !config.applicationKey) {
    throw new Error("Thiếu thông tin xác thực Backblaze B2");
  }
  b2 = new B2({
    applicationKeyId: config.applicationKeyId,
    applicationKey: config.applicationKey,
  });
  // Reset auth cache khi khởi tạo lại
  lastAuthTime = 0;
  return b2;
}

// Hàm đảm bảo authorization token còn hiệu lực
async function ensureFreshAuth(forceRefresh = false) {
  const now = Date.now();

  if (!b2) {
    throw new Error("B2 chưa được khởi tạo");
  }

  // Refresh nếu token quá cũ hoặc bắt buộc refresh
  if (forceRefresh || now - lastAuthTime > AUTH_CACHE_DURATION) {
    try {
      console.log("🔄 Đang làm mới authorization token...");
      const { data: authData } = await b2.authorize();
      lastAuthTime = now;
      return authData;
    } catch (error) {
      console.error("❌ Lỗi authorization:", error.message);
      throw error;
    }
  }

  // Sử dụng token hiện tại
  return null;
}

// Hàm retry với fresh token
async function retryWithFreshAuth(operation, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Thử lại lần ${attempt + 1}/${maxRetries}...`);
        // Force refresh token trước khi retry
        await ensureFreshAuth(true);
      }

      return await operation();
    } catch (error) {
      lastError = error;

      // Nếu là lỗi về authorization token và còn có attempt
      if (
        error.message.includes("authorizationToken") ||
        error.message.includes("authorization") ||
        error.response?.status === 401
      ) {
        if (attempt < maxRetries - 1) {
          console.log(`⚠️ Lỗi auth token, sẽ thử lại...`);
          continue;
        }
      }

      // Nếu không phải lỗi auth hoặc hết attempt thì throw
      throw error;
    }
  }

  throw lastError;
}

async function uploadFile(
  filePath,
  bucketId,
  b2FileName = null,
  folderName = null,
  config = null
) {
  try {
    if (config) {
      initializeB2(config);
    } else if (!b2) {
      throw new Error(
        "B2 chưa được khởi tạo. Vui lòng cung cấp thông tin xác thực."
      );
    }

    // Đảm bảo có authorization token hợp lệ
    const authData = await ensureFreshAuth();
    const downloadUrl =
      authData?.downloadUrl || (await b2.authorize()).data.downloadUrl;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File không tồn tại: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    const LARGE_FILE_SIZE = 100 * 1024 * 1024;

    const ext = path.extname(filePath);
    const baseName = b2FileName || path.basename(filePath, ext);
    const uniqueSuffix = `_${Date.now()}${ext}`;
    const finalFileName = baseName + uniqueSuffix;
    const fullFilePath = folderName
      ? `${folderName.replace(/\/$/, "")}/${finalFileName}`
      : finalFileName;

    let result;

    if (fileSize < LARGE_FILE_SIZE) {
      // Upload trực tiếp với retry logic
      result = await retryWithFreshAuth(async () => {
        const fileBuffer = fs.readFileSync(filePath);

        // Lấy upload URL mới cho mỗi lần upload
        const { data: uploadData } = await b2.getUploadUrl({ bucketId });
        const uploadUrl = uploadData.uploadUrl;
        const uploadAuthToken = uploadData.authorizationToken;

        const contentSha1 = crypto
          .createHash("sha1")
          .update(fileBuffer)
          .digest("hex");

        const { data: res } = await b2.uploadFile({
          uploadUrl,
          uploadAuthToken,
          fileName: fullFilePath,
          data: fileBuffer,
          contentLength: fileBuffer.length,
          contentSha1,
          contentType: "application/octet-stream",
        });

        console.log(`✅ Upload file nhỏ hoàn tất: ${fullFilePath}`);
        return res;
      });
    } else {
      // Upload theo phần (multipart) với retry logic
      result = await retryWithFreshAuth(async () => {
        const PART_SIZE = 100 * 1024 * 1024;

        const { data: startRes } = await b2.startLargeFile({
          bucketId,
          fileName: fullFilePath,
          contentType: "application/octet-stream",
        });

        const fileId = startRes.fileId;
        const partSha1Array = [];
        const fd = fs.openSync(filePath, "r");
        let offset = 0;
        let partNumber = 1;

        console.log(
          `🔄 Bắt đầu upload file lớn "${fullFilePath}" (size: ${fileSize} bytes)`
        );

        try {
          while (offset < fileSize) {
            const remaining = fileSize - offset;
            const chunkSize = Math.min(PART_SIZE, remaining);
            const buffer = Buffer.alloc(chunkSize);
            fs.readSync(fd, buffer, 0, chunkSize, offset);

            // Lấy upload URL mới cho mỗi part
            const { data: uploadPartUrlData } = await b2.getUploadPartUrl({
              fileId,
            });

            const sha1 = crypto.createHash("sha1").update(buffer).digest("hex");
            partSha1Array.push(sha1);

            // Upload part với retry cho từng part
            await retryWithFreshAuth(async () => {
              return await b2.uploadPart({
                partNumber,
                uploadUrl: uploadPartUrlData.uploadUrl,
                uploadAuthToken: uploadPartUrlData.authorizationToken,
                data: buffer,
                contentLength: chunkSize,
                contentSha1: sha1,
              });
            }, 1); // Chỉ retry 1 lần cho mỗi part

            console.log(
              `✅ Đã upload phần ${partNumber}, size: ${chunkSize} bytes`
            );

            offset += chunkSize;
            partNumber++;
          }

          const { data: finishRes } = await b2.finishLargeFile({
            fileId,
            partSha1Array,
          });

          console.log(`🎉 Upload file lớn hoàn tất: ${fullFilePath}`);
          return finishRes;
        } finally {
          fs.closeSync(fd);
        }
      });
    }

    // Lấy tên bucket với retry
    const bucketData = await retryWithFreshAuth(async () => {
      return await listBuckets(config);
    }, 1);

    const bucket = bucketData.find((b) => b.bucketId === bucketId);
    const bucketName = bucket?.bucketName || "";

    // Chỉ encode folderName nếu có, giữ nguyên bucketName và fileName
    let encodedFullFilePath = fullFilePath;
    if (folderName) {
      const encodedFolderName = encodeURIComponent(
        folderName.replace(/\/$/, "")
      );
      encodedFullFilePath = `${encodedFolderName}/${finalFileName}`;
    }

    // Tạo public URL (friendly URL)
    const publicUrl = `${downloadUrl}/file/${bucketName}/${encodedFullFilePath}`;

    // Tạo native URL (API URL) - sử dụng fileId từ response
    const nativeUrl = `${downloadUrl}/b2api/v1/b2_download_file_by_id?fileId=${result.fileId}`;

    return {
      ...result,
      bucketName,
      publicUrl, // URL thân thiện: https://f003.backblazeb2.com/file/bucketName/fileName
      nativeUrl, // URL native: https://f003.backblazeb2.com/b2api/v1/b2_download_file_by_id?fileId=...
    };
  } catch (error) {
    console.error("❌ Lỗi upload file:", error.message);
    throw error;
  }
}

async function listBuckets(config = null) {
  try {
    // Nếu có config được truyền vào, khởi tạo lại B2
    if (config) {
      initializeB2(config);
    } else if (!b2) {
      // Nếu b2 chưa được khởi tạo và không có config được truyền vào
      throw new Error(
        "B2 chưa được khởi tạo. Vui lòng cung cấp thông tin xác thực."
      );
    }

    // Sử dụng retry logic cho listBuckets
    return await retryWithFreshAuth(async () => {
      await ensureFreshAuth();
      const response = await b2.listBuckets();
      return response.data.buckets;
    });
  } catch (error) {
    console.error("Lỗi:", error.message);
    throw error;
  }
}

/**
 * Tìm tệp dựa trên tên hoặc đường dẫn và trả về thông tin của tệp
 * @param {string} fileName - Tên tệp hoặc đường dẫn đầy đủ cần tìm
 * @param {string} bucketId - ID của bucket chứa tệp
 * @param {object} config - Thông tin cấu hình Backblaze (tùy chọn)
 * @returns {Promise<object|null>} - Thông tin của tệp nếu tìm thấy, null nếu không tìm thấy
 */
async function findFileByName(fileName, bucketId, config = null) {
  try {
    // Nếu có config được truyền vào, khởi tạo lại B2
    if (config) {
      initializeB2(config);
    } else if (!b2) {
      throw new Error(
        "B2 chưa được khởi tạo. Vui lòng cung cấp thông tin xác thực."
      );
    }

    await b2.authorize();

    // Lấy tên tệp từ đường dẫn đầy đủ (nếu là đường dẫn)
    const baseFileName = path.basename(fileName);

    // Liệt kê các tệp trong bucket
    let startFileName = null;
    let files = [];
    let moreFiles = true;

    while (moreFiles) {
      const response = await b2.listFileNames({
        bucketId: bucketId,
        startFileName: startFileName,
        maxFileCount: 1000,
      });

      if (response.data.files.length > 0) {
        files = files.concat(response.data.files);

        if (response.data.nextFileName) {
          startFileName = response.data.nextFileName;
        } else {
          moreFiles = false;
        }
      } else {
        moreFiles = false;
      }
    }

    // Tìm tệp phù hợp
    const foundFile = files.find(
      (file) =>
        file.fileName === fileName ||
        file.fileName === baseFileName ||
        file.fileName.includes(baseFileName)
    );

    if (foundFile) {
      console.log("Đã tìm thấy tệp:", foundFile);
      return foundFile;
    } else {
      console.log(`Không tìm thấy tệp có tên '${fileName}' trong bucket`);
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi tìm tệp:", error.message);
    throw error;
  }
}

/**
 * Xóa tệp từ Backblaze B2
 * @param {string} fileNameOrUrl - Tên tệp, URL, hoặc fileId cần xóa
 * @param {string} bucketId - ID của bucket chứa tệp
 * @param {object} config - Thông tin cấu hình Backblaze (tùy chọn)
 * @returns {Promise<object>} - Kết quả xóa tệp
 */
async function deleteFile(fileNameOrUrl, bucketId, config = null) {
  try {
    // Nếu có config được truyền vào, khởi tạo lại B2
    if (config) {
      initializeB2(config);
    } else if (!b2) {
      throw new Error(
        "B2 chưa được khởi tạo. Vui lòng cung cấp thông tin xác thực."
      );
    }

    await b2.authorize();

    let fileId = null;
    let fileName = null;

    // Kiểm tra nếu input là URL
    if (fileNameOrUrl.startsWith("http")) {
      try {
        const url = new URL(fileNameOrUrl);

        // Kiểm tra nếu là native URL có fileId
        if (url.pathname.includes("b2_download_file_by_id")) {
          fileId = url.searchParams.get("fileId");
        } else {
          // Nếu là friendly URL, trích xuất fileName từ path
          const pathParts = url.pathname.split("/");

          if (pathParts.length >= 4) {
            const filePathParts = pathParts.slice(3); // Lấy tất cả phần sau bucketName

            // Decode từng phần riêng biệt để xử lý đúng ký tự đặc biệt
            const decodedPathParts = filePathParts.map((part) =>
              decodeURIComponent(part)
            );
            fileName = decodedPathParts.join("/");

            console.log(`📁 Extracted fileName from URL: ${fileName}`);
          }
        }
      } catch (urlError) {
        throw new Error(`URL không hợp lệ: ${fileNameOrUrl}`);
      }
    } else {
      // Nếu không phải URL, coi như là fileName hoặc fileId
      if (fileNameOrUrl.length > 40 && fileNameOrUrl.includes("_")) {
        // Có vẻ như fileId (format: 4_z...)
        fileId = fileNameOrUrl;
      } else {
        fileName = fileNameOrUrl;
      }
    }

    // Nếu chỉ có fileName, cần tìm fileId thông qua listFileNames
    if (!fileId && fileName) {
      console.log(`🔍 Đang tìm fileId cho file: ${fileName}`);

      const listResponse = await b2.listFileNames({
        bucketId: bucketId,
        startFileName: fileName,
        maxFileCount: 100, // Tăng số lượng để tìm chính xác hơn
      });

      const files = listResponse.data.files;
      const targetFile = files.find((file) => file.fileName === fileName);

      if (!targetFile) {
        // Thử tìm với prefix nếu không tìm thấy exact match
        console.log(`🔍 Không tìm thấy exact match, đang tìm với prefix...`);
        const prefixMatches = files.filter((file) =>
          file.fileName.includes(fileName)
        );

        if (prefixMatches.length > 0) {
          console.log(
            `📋 Tìm thấy ${prefixMatches.length} file(s) có chứa "${fileName}":`
          );
          prefixMatches.forEach((file) => console.log(`   - ${file.fileName}`));
        }

        throw new Error(`Không tìm thấy file: ${fileName}`);
      }

      fileId = targetFile.fileId;
      console.log(`✅ Tìm thấy fileId: ${fileId}`);
    }

    // Nếu có fileId, lấy thông tin file để có fileName
    if (fileId && !fileName) {
      const fileInfo = await b2.getFileInfo({
        fileId: fileId,
      });
      fileName = fileInfo.data.fileName;
    }

    if (!fileId || !fileName) {
      throw new Error("Không thể xác định fileId hoặc fileName để xóa");
    }

    console.log(`🗑️ Đang xóa file: ${fileName} (ID: ${fileId})`);

    const response = await b2.deleteFileVersion({
      fileId: fileId,
      fileName: fileName,
    });

    console.log(`✅ Đã xóa thành công: ${fileName}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa file ${fileNameOrUrl}:`, error.message);
    throw error;
  }
}

/**
 * Xóa nhiều tệp từ Backblaze B2 (dựa trên URL hoặc đường dẫn)
 * @param {Array<string>} fileUrls - Mảng các URL hoặc đường dẫn tệp cần xóa
 * @param {string} bucketId - ID của bucket chứa tệp
 * @param {object} config - Thông tin cấu hình Backblaze (tùy chọn)
 * @returns {Promise<Array>} - Mảng kết quả xóa tệp
 */
async function deleteMultipleFiles(fileUrls, bucketId, config = null) {
  try {
    if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
      throw new Error("Danh sách tệp cần xóa trống hoặc không hợp lệ");
    }

    // Khởi tạo B2 nếu cần
    if (config) {
      initializeB2(config);
    } else if (!b2) {
      throw new Error(
        "B2 chưa được khởi tạo. Vui lòng cung cấp thông tin xác thực."
      );
    }

    await b2.authorize();

    const results = [];
    const errors = [];

    console.log(`🗑️ Bắt đầu xóa ${fileUrls.length} file(s)...`);

    // Xử lý từng URL/đường dẫn
    for (const fileUrl of fileUrls) {
      try {
        const result = await deleteFile(fileUrl, bucketId);
        results.push({ url: fileUrl, result, success: true });
      } catch (error) {
        console.error(`❌ Lỗi khi xóa file ${fileUrl}:`, error.message);
        errors.push({ url: fileUrl, error: error.message });
        results.push({ url: fileUrl, error: error.message, success: false });
      }
    }

    // Tổng kết kết quả
    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ Đã xóa ${successCount}/${fileUrls.length} file(s)`);

    if (errors.length > 0) {
      console.warn(`⚠️ Có ${errors.length} lỗi khi xóa file:`);
      errors.forEach((err) => console.warn(`   - ${err.url}: ${err.error}`));
    }

    return results;
  } catch (error) {
    console.error("❌ Lỗi khi xóa nhiều file:", error.message);
    throw error;
  }
}

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

module.exports.backblazeAPI = {
  initializeB2,
  uploadFile,
  listBuckets,
  findFileByName,
  deleteFile,
  deleteMultipleFiles,
  downloadFile,
};
