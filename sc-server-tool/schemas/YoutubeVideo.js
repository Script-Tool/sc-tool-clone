const mongoose = require('mongoose')

let Schema = mongoose.Schema

let YTVideo = new Schema({
  id: Number ,
  url: String ,
  url_type: String,
  title: String,
  first_video: String,
  total_times: Number,
  watch_time: Number,
  max_watch_time: Number,
  video_time: Number,
  current_view: Number,
  max_view: Number,
  category: String,
  suggest_videos: String,
  suggest_percent: Number,
  hour_view: Number,
  priority: Number,
  page_watch: Number,
  like_percent: Number,
  last_watch: Date,
  watch_interval: Number,
  last_hour: Date,
  last_hour_view: Number,
  start_time: Date,
  stop_time: Date,
  enable: Number,
  create_time: Date,
  update_time: Date,

  keyword: String,
  channel_name: String,
  video: String,
  playlist_url: String
}, { strict: false })

YTVideo.set('timestamps', true)

module.exports = YTVideo
