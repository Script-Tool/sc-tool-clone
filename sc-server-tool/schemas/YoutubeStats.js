const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const YoutubeStats = new Schema(
  {
    profile_email: {
      type: String,
      required: true,
      index: true,
    },
    channelId: String,
    viewCount: Number,
    subscriberCount: Number,
    viewsChange: { type: Number, default: 0 },
    subsChange: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// * Thêm index cho profile_email để tối ưu hiệu suất truy vấn
YoutubeStats.index({ profile_email: 1 });

YoutubeStats.virtual("youtube_profile", {
  ref: "YoutubeProfile",
  localField: "profile_email",
  foreignField: "profile_email",
  justOne: true,
});

module.exports = YoutubeStats;
