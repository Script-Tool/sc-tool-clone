const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

async function initApiKeys() {
  try {
    const ApiKeyModel = getModel('APIKey');
    
    // Kiểm tra xem đã có API keys trong database chưa
    const existingKeys = await ApiKeyModel.countDocuments();
    if (existingKeys > 0) {
      console.log('API keys already exist. Skipping initialization.');
      return;
    }

    const csvFilePath = path.join(__dirname, '../../config/apikey.csv');
    
    return new Promise((resolve, reject) => {
      const fileRows = [];

      fs.createReadStream(csvFilePath)
        .pipe(csv.parse())
        .on('data', (data) => {
          fileRows.push(data);
        })
        .on('end', async () => {
          try {
            // Bỏ qua hàng đầu tiên nếu nó chứa tiêu đề
            if (fileRows[0][0].toLowerCase().indexOf('api_key') === 0) {
              fileRows.shift();
            }

            for (const keyData of fileRows) {
              await ApiKeyModel.create({
                key: keyData[0],
                type: keyData[1] || 'youtube_api'
              });
            }

            console.log('API keys initialized successfully');
            resolve();
          } catch (error) {
            console.error('Error initializing API keys:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error in initApiKeys:', error);
  }
}

module.exports = initApiKeys;