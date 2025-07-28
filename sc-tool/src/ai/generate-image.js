const OpenAI = require("openai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const openai = new OpenAI({
  apiKey:
    "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",
});

async function generateAndDownloadImage(prompt, outputPath) {
  try {
    // Initialize OpenAI

    // Generate image
    console.log("Generating image...");
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt + " with dark manga/anime style",
      n: 1,
      size: "1792x1024",
    });

    const image_url = response.data[0].url;
    console.log("Image generated successfully");

    // Download image
    return downloadImage(image_url, outputPath)
  } catch (error) {
    console.error("Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function downloadImage(image_url, outputPath) {
  console.log("Downloading image...");
    const imageResponse = await axios({
      url: image_url,
      responseType: "arraybuffer",
    });

    try {
      // Đảm bảo thư mục tồn tại
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, imageResponse.data);
      console.log(`Image saved to: ${outputPath}`);

      return {
        success: true,
        image_url: image_url,
        local_path: outputPath,
      };
    } catch (fsError) {
      // Nếu không tạo được thư mục/file, thử lưu vào thư mục hiện tại
      const filename = path.basename(outputPath);
      const fallbackPath = path.join(process.cwd(), filename);

      fs.writeFileSync(fallbackPath, imageResponse.data);
      console.log(
        `Failed to save to original path. Image saved to: ${fallbackPath}`
      );

      return {
        success: true,
        image_url: image_url,
        local_path: fallbackPath,
      };
    }
}

module.exports = {generateAndDownloadImage, downloadImage};
