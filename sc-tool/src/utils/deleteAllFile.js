const fs = require("fs");
const path = require("path");
/**
 * Xóa tất cả các tệp trong một thư mục được chỉ định
 * @param {string} directoryPath - Đường dẫn đến thư mục cần dọn dẹp
 * @returns {Promise<{success: boolean, deletedFiles: string[], errors: {file: string, error: Error}[]}>} - Kết quả của quá trình xóa
 */

async function cleanupDirectory(directoryPath) {
  const result = {
    success: true,
    deletedFiles: [],
    deletedFolders: [],
    errors: [],
  };

  try {
    // Tạo thư mục nếu chưa tồn tại
    await fs.promises.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    console.error(`Không thể tạo thư mục: ${directoryPath}`, error);
    result.success = false;
    result.errors.push({ path: directoryPath, error: error.message });
    return result;
  }

  try {
    const files = await fs.promises.readdir(directoryPath);
    if (files.length === 0) {
      return result;
    }

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      try {
        const stats = await fs.promises.stat(filePath);

        if (stats.isFile()) {
          // Xóa file
          await fs.promises.unlink(filePath);
          result.deletedFiles.push(filePath);
        } else if (stats.isDirectory()) {
          // Xóa folder và tất cả nội dung bên trong
          await fs.promises.rm(filePath, { recursive: true });
          result.deletedFolders.push(filePath);
        }
      } catch (error) {
        console.error(`Không thể xóa ${filePath}:`, error);
        result.errors.push({ path: filePath, error: error.message });
        result.success = false;
      }
    }

    return result;
  } catch (error) {
    console.error(`Lỗi khi đọc thư mục ${directoryPath}:`, error);
    result.success = false;
    result.errors.push({ path: directoryPath, error: error.message });
    return result;
  }
}

module.exports = cleanupDirectory;
// Ví dụ sử dụng:
// const downloadDir = path.join(__dirname, 'Downloads');
// cleanupDirectory(downloadDir)
//   .then(result => {
//     if (result.success) {
//       console.log(`Đã xóa thành công ${result.deletedFiles.length} tệp`);
//     } else {
//       console.log(`Đã xóa ${result.deletedFiles.length} tệp, nhưng có ${result.errors.length} lỗi`);
//     }
//   })
//   .catch(error => {
//     console.error('Lỗi khi dọn dẹp thư mục:', error);
//   });
