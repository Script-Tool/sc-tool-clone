
// Lấy id kênh youtube theo user 
async function getChannelID(channelName = "") {

  channelName = channelName.split("/")[0].slice(1);

  let youtubeAPIKey = await getModel("APIKey").getRandomKey("youtube_api");
  const rs = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=id&q=${channelName}&type=channel&key=${youtubeAPIKey}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data) {
        return data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Error while get channel youtube on api", err);
      return -1;
    });

  let item = (rs?.items || [])[0];

  if (item.id.kind == "youtube#channel") {
    let channelId = item.id.channelId;
    return channelId;
  }
}

module.exports = { getChannelID };
