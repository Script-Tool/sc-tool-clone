const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const Browsers = require("../../schemas/Browsers");

const Browser = mongoose.model("Browser", Browsers);

async function initBrowsers() {
  try {
    // Kiểm tra xem đã có browsers trong database chưa
    const existingBrowsers = await Browser.find();
    if (existingBrowsers.length > 0) {
      console.log('Browsers already initialized. Skipping...');
      return;
    }
    // Đọc file JSON chứa dữ liệu browsers
    const browsersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/initial-browsers.json'), 'utf8'));

    // Thêm các browsers vào database
    await Browser.insertMany(browsersData, { ordered: false });

    console.log('Browsers initialized successfully');
  } catch (error) {
    if (error.code === 11000) {
      console.log('Duplicate keys found, skipping duplicates');
    } else {
      console.error('Error initializing browsers:', error);
    }
  }
}

module.exports = initBrowsers;