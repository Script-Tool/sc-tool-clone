const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey:
    "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",
});

/**
 * Creates an audio file from text using OpenAI's TTS API
 * @param {string} text The text to convert to speech
 * @param {string} outputPath The path to save the MP3 file (optional)
 * @param {string} voice The voice to use (optional, defaults to 'alloy')
 * @returns {Promise<string>} Path to the saved audio file
 */

async function textToSpeech(
  text,
  outputPath = "./speech.mp3",
  voice = "alloy"
) {
  try {
    // Validate inputs
    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new Error("Valid text input is required.");
    }

    console.log("Generating mp3...");

    // Resolve the full path
    const speechFile = path.resolve(outputPath);

    // Create speech using OpenAI API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
    });

    // Convert to buffer and write to file
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    console.log("File successfully written to:", speechFile);
    return speechFile;
  } catch (error) {
    console.error("Error in textToSpeech:", error.message);
    throw error;
  }
}

module.exports = textToSpeech;
