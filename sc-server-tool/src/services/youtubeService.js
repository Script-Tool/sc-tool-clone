const { google } = require("googleapis");
const { getRandomAPIKey } = require("./youtube-api/videoNamesFromChannelID");
const youtubeAPI = require("./google-api/youtubeAPI");

async function addChannelToWatchlist(data) {
  try {
    const Channel = getModel("Channel");
    const { keyword: channelId, tags, pllDescription, suggest_channel } = data;
    const existingChannel = await Channel.findOne({ channelId });
    if (existingChannel) {
      console.log(`Channel ${channelId} already in watchlist`);
      return false;
    }
    const channel = new Channel({
      channelId,
      tags: tags || "",
      pllDescription: pllDescription || "",
      suggestChannel: suggest_channel,
      lastChecked: new Date(),
    });
    await channel.save();
    console.log(`Added channel ${channelId} to watchlist`);
    return true;
  } catch (error) {
    console.error("Error adding channel to watchlist:", error);
    throw error;
  }
}

async function checkNewVideosFromChannel(channelId, lastCheckedDate) {
  const maxRetries = 2;
  let retries = 0;

  async function attemptRequest() {
    const YOUTUBE_API_KEY = await getRandomAPIKey("youtube_api");
    const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

    try {
      const response = await youtube.search.list({
        part: "id,snippet",
        channelId: channelId,
        order: "date",
        type: "video",
        publishedAfter: lastCheckedDate.toISOString(),
        maxResults: 50,
      });

      return response.data.items;
    } catch (error) {
      console.error(
        `Error checking new videos (attempt ${retries + 1}):`,
        error
      );

      if (retries < maxRetries) {
        retries++;
        console.log(`Retrying with a new API key (attempt ${retries + 1})...`);
        return attemptRequest();
      } else {
        console.error("Max retries reached. Unable to fetch new videos.");
        return [];
      }
    }
  }

  return attemptRequest();
}

async function createPlaylistFromVideo(videoTitle, videoId, channel) {
  try {
    const Playlist = getModel("Playlist");

    const dess = (channel.pllDescription || "").split("#");
    const randomPos = Math.floor(Math.random() * dess.length);
    const pllDes = dess[randomPos];
    await Playlist.loadCreatePlaylistServices({
      keyword: videoTitle,
      tags: channel.tags,
      suggest_channel: channel.suggestChannel,
      pll_description: `${pllDes}`,
    });
    console.log(`Created playlist for new video: ${videoTitle}`);
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw error;
  }
}

async function checkAllChannelsAndCreatePlaylists() {
  const Channel = getModel("Channel");
  const channels = await Channel.find({});

  await Promise.all(
    channels.map(async (channel) => {
      const newVideos = await checkNewVideosFromChannel(
        channel.channelId.replace(/^channel\//, ""),
        channel.lastChecked
      );

      await Promise.all(
        newVideos.map((video) =>
          createPlaylistFromVideo(
            video.snippet.title,
            video.id.videoId,
            channel
          )
        )
      );

      if (newVideos.length > 0) {
        channel.lastChecked = new Date();
        await channel.save();
      }
    })
  );
}

async function getVideoTitlesFromChannel(options) {
  const { channelId, limit } = options;
  const YOUTUBE_API_KEY = await getRandomAPIKey("youtube_api");
  const youtube = google.youtube({ version: "v3", auth: YOUTUBE_API_KEY });

  let allTitles = [];
  let nextPageToken = "";

  try {
    while (allTitles.length < limit) {
      const response = await youtube.search.list({
        part: "snippet",
        channelId: channelId,
        type: "video",
        order: "date",
        maxResults: Math.min(50, limit - allTitles.length),
        pageToken: nextPageToken,
      });

      allTitles = allTitles.concat(
        response.data.items.map((item) => item.snippet.title)
      );

      nextPageToken = response.data.nextPageToken;
      if (!nextPageToken) break; // No more results available
    }

    console.log("Total videos fetched:", allTitles.length);
    return allTitles.slice(0, limit); // Ensure we don't exceed the requested limit
  } catch (error) {
    console.error("Error fetching video titles:", error);
    throw error;
  }
}

async function statisticYoutube() {
  try {
    const YouTubeProfile = await getModel("YoutubeProfile");
    const Profile = await getModel("Profile");
    const YoutubeStats = await getModel("YoutubeStats");
    const youTubeProfiles = await YouTubeProfile.find({});

    for (const yp of youTubeProfiles) {
      const profile = await Profile.findOne({
        email: yp.profile_email,
      });

      if (!profile.channel_link) {
        console.log(`❌ Không tìm thấy kênh!`);
        continue;
      }

      const channelId = youtubeAPI.getYouTubeChannelId(profile.channel_link);

      if (!channelId) {
        console.log(`❌ Không tìm thấy kênh!`);
        continue;
      }

      const data = await youtubeAPI.getChannelDetails(channelId);
      if (!data) {
        console.log(`❌ Không tìm thấy kênh!`);
        continue;
      }

      const youtubeStats = await YoutubeStats.findOne({
        profile_email: yp.profile_email,
      })
        .sort({ timestamp: -1 })
        .lean();

      const stats = data.statistics;
      await YoutubeStats.create({
        profile_email: yp.profile_email,
        channelId: data.id,
        viewCount: parseInt(stats.viewCount),
        subscriberCount: parseInt(stats.subscriberCount),
        viewsChange: parseInt(stats.viewCount) - (youtubeStats?.viewCount || 0),
        subsChange:
          parseInt(stats.subscriberCount) -
          (youtubeStats?.subscriberCount || 0),
      });
    }
  } catch (error) {
    console.error("Error fetching video titles:", error);
    throw error;
  }
}

module.exports = {
  addChannelToWatchlist,
  checkAllChannelsAndCreatePlaylists,
  getVideoTitlesFromChannel,
  statisticYoutube,
};
