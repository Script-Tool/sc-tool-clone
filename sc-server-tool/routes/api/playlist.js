const express = require('express');
const router = express.Router();

router.post('/report/playlist_jct', async function(req, res) {
  try {
    let data = req.body
    const PLaylistJCTModel = await getModel("PlaylistJCT")
    if (data && data.url) {
      const ProfileModel =  getModel('Profile')
      const ServiceModel =  getModel('Service')
      const service = await ServiceModel.findOne({ _id: data.service_id + '' }, '_id customer note')
      const profile = await ProfileModel.findOne({ id: Number(data.pid) }, 'id email')
      if (service && profile) {
        let JCT = await PLaylistJCTModel.create({
          url: data.url,
          playlist_name: data.playlist_name,
          customer: service.customer,
          profile_email: profile.email,
          user_position: data.user_position,
          tag: service.note,
          service_id: service.id,
        })

        if (JCT) {
          await ServiceModel.create({
            script_code: 'add_video_playlist',
            data: `{
              "playlist_name": "${data.playlist_name}",
              "suggest_channel": "${data.suggest_channel}",
              "playlist_url": "${data.url}",
              "total_added_from_search": "",
              "total_added_from_channel": ""
            }`,
            start_max_time: 86400000,
            end_max_time: 86400000,
            //last_report_time: Date.now(),
            customer: service.customer,
            note: service.note
          })
        }

        await ServiceModel.deleteOne({ _id: service._id })
      }
    }
    
    res.send({ success: true })
  } catch (error) {
    console.log(error);
    res.send({ success: false })
  }
})


// Route để lấy video ngẫu nhiên
router.get('/YTVideo', async function (req, res) {
  let playlist = {};

  if (req.query.isGetMobile) {
    const viewTypes = [
      { key: 'suggest_percent', sort: youtube_config.suggest_percent, percent: 0 },
      { key: 'page_watch', sort: youtube_config.page_watch, percent: 0 },
      { key: 'home_percent', sort: youtube_config.home_percent, percent: 0 },
      { key: 'direct_percent', sort: youtube_config.direct_percent, percent: 0 },
      { key: 'search_percent', sort: youtube_config.search_percent, percent: 0 },
      { key: 'google_percent', sort: youtube_config.google_percent, percent: 0 },
    ];
  
    viewTypes.forEach(element => {
      playlist[element.key] = element.sort;
    });

    const YtVideo = await getModel('YoutubeVideo');
    const countRs = await YtVideo.countDocuments();
    const randomPosition = Math.floor(Math.random() * countRs);
    const video = await YtVideo.findOne().skip(randomPosition);
    playlist = { ...video.toObject(), ...playlist };
  } else {
    const Playlist = await getModel('Playlist');
    const countRs = await Playlist.countDocuments();
    const playlistData = await Playlist.findOne().skip(Math.floor(Math.random() * countRs));

    if (playlist) {
      playlist.playlist_url = playlist.data;
      playlist.playlist_percent = 100;
      playlist.url_type = 'playlist';
      playlist.total_times = 1;
      playlist.playlist_index = playlist.total_times;

      if (playlist.sub_percent && Math.random() < Number(playlist.sub_percent) / 1000) {
        playlist.is_sub = true;
      }
    }
  }

  if (!playlist.sub_percent && Math.random() < Number(youtube_config.sub_percent) / 1000) {
    playlist.is_sub = true;
  }

  res.send({ playlist });
});

module.exports = router;
