const mongoose = require('mongoose')
const axios = require('axios')
let Schema = mongoose.Schema

let PlaylistSchema = new Schema({
  id: Number,
  url_type: { type: String, default: 'playlist' },
  data: String,
  total_times_next_video: Number,
  watching_time_non_ads: Number,
  watching_time_start_ads: Number,
  watching_time_end_ads: Number,
  sub_percent: Number,
  ads_percent: Number,
  vm_names: Array,
  group_type: Number,
}, { strict: false })

PlaylistSchema.set('timestamps', true)

PlaylistSchema.pre('save', async function (next) {
  if (this.isNew) {
    let ID = await getModel('ID')
    let newID = await ID.next('Playlist')
    this.id = newID
  }
  
  next()
})

PlaylistSchema.statics.getPlaylist = async function (filterData) {
  let Playlist = await getModel('Playlist')
  let playlistFilter = {}

  //let myDate = new Date()
  //let hour = Number(myDate.toLocaleTimeString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh", hour12: false}).split(':')[0])
  //let oddPercent = youtube_config.percent_view_channel_youtube[hour]
  //const percent = Math.floor(Math.random() * 100)
  //let checkNumber = percent <= oddPercent ? 1 : 0  // odd : even
  //playlistFilter.group_type = { "$mod" : [ 2, checkNumber ] }

  if (filterData.vm_name) {
    playlistFilter['$or'] = [
      { vm_names: filterData.vm_name },
      { vm_names: { $size: 0 } }
    ]
  }

  let countRs = await Playlist.find(playlistFilter).countDocuments()
  let playlistData = await Playlist.findOne(playlistFilter).skip(Math.floor(Math.random() * countRs))

  // if (!playlistData) {
  //   playlistFilter.group_type = { "$mod" : [ 2, checkNumber?0:1 ] }
  //   countRs = await Playlist.find(playlistFilter).countDocuments()
  //   playlistData = await Playlist.findOne(playlistFilter).skip(Math.floor(Math.random() * countRs))
  // }
  return playlistData
}

PlaylistSchema.statics.loadCreatePlaylistServices = async function (data){
  const ServiceModel = getModel('Service')

  await ServiceModel.create({
    script_code: 'create_playlist',
    data: `{
      "playlist_name": "${data.keyword}",
      "suggest_channel": "${data.suggest_channel || ''}",
      "pll_description": "${data.pll_description || ''}",
      "total_added_from_search": "",
      "total_added_from_channel": ""
    }`,
    remaining: -1,
    start_max_time: 1,
    end_max_time: 1,
    customer: data.customer || 0,
    note: data.tags || ''
  })
}
module.exports = PlaylistSchema
