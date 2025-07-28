const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Tạo thư mục download nếu chưa tồn tại
const downloadDir = path.join(process.cwd(), 'download');
if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir);
}

// Tên file từ URL


async function downloadMP3(url, fileName) {
    const filePath = path.join(downloadDir, fileName);
    try {
        // Tải file
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        // Tạo write stream
        const writer = fs.createWriteStream(filePath);

        // Pipe response data vào file
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve();
            });
            writer.on('error', (err) => {
                console.error('Error downloading file:', err);
                reject(err);
            });
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Chạy function download
module.exports = downloadMP3