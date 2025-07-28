const mongoose = require('mongoose')

let Schema = mongoose.Schema

let PlaylistJCTSchema = new Schema({
  url: { type: String },
  playlist_name: String,
  customer: Number,
  profile_email: String,
  user_position: Number,
  total_video: Number,
  total_view: Number,
  tag: String,
  service_id: Number,
  is_block: Boolean
}, { strict: false })

PlaylistJCTSchema.set('timestamps', true)

module.exports = PlaylistJCTSchema
