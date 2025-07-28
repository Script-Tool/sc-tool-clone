const youtubeService = require("../../src/services/youtubeService");

async function manualCheck(req, res) {
  try {
    await youtubeService.checkAllChannelsAndCreatePlaylists();
    res.send({ success: true, message: "Manual check completed" });
  } catch (error) {
    console.error("Error during manual check:", error);
    res.status(500).send({ error: "An error occurred during manual check" });
  }
}

module.exports = {
  manualCheck,
};
