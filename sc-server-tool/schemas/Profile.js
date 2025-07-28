const mongoose = require("mongoose");

const { Schema } = mongoose;

const ProfileSchema = new Schema(
  {
    email: String,
    password: String,
    id: Number,
    old_recover_mail: String,
    recover_mail: String,
    recover_phone: String,
    status: { type: String, default: "NEW" },
    vm_id: String,
    proxy: Number,
    description: { type: String, default: "" },
    total_created_users: { type: Number, default: 0 },
    executed_services: { type: Array, default: [] },
    current_position_script: { type: Number, default: -1 },
    total_bat: { type: Number, default: 0 },
    is_disabled_ads: { type: Boolean, default: false },
    count_brave_rounds: { type: Number, default: 0 },
    is_disabled: { type: Boolean, default: false },
    user_name: String,
    verified: { type: Boolean },
    verified_studio: { type: Number, default: 0 }, // -1 Không Cần Xác Minh, 0 Chưa đủ điều kiện, 1 Đủ điều kiện
    used_for_recovery: { type: Number }, // 1 verifying, 2 verified
    reco_mails: { type: Array, default: [] },
    last_time_reset: Date,
    partner_id: String,
    type: String, // tiktok, facebook, youtube
    imap_email: String,
    imap_password: String,
    temp_new_pass: String,
    topic_content: String,
    twoFA: String,
    proxy_server: String,
    proxy_username: String,
    proxy_password: String,
    channel_link: String,
    gemini_key: String,
    youtube_key: String,
    usage_status: {
      type: String,
      enum: ["", "USED", "IN_USED"],
      default: "",
    },
    backup_code: String,
    elevenlabs_key: String,
    is_reset_backup_code: { type: Boolean, default: false },
    is_change_2fa: { type: Boolean, default: false },
  },
  { strict: false, timestamps: true }
);

// Middleware để tự động tạo ID cho profile mới
ProfileSchema.pre("save", async function (next) {
  if (this.isNew) {
    const ID = await getModel("ID");
    const newID = await ID.next("Profile");
    this.id = newID;
  }
  next();
});

// Phương thức để lấy ngẫu nhiên một profile theo bộ lọc
ProfileSchema.statics.getRandomProfile = async function (filter) {
  const countRs = await this.countDocuments(filter);
  const randomPosition = Math.floor(Math.random() * countRs);
  const profile = await this.findOne(filter).skip(randomPosition);
  return profile;
};

// Phương thức để tạo bộ lọc từ query parameters
ProfileSchema.statics.getQuery = function (req) {
  const filter = {};

  if (req.query.statusDescription) {
    filter.description = { $regex: req.query.statusDescription.trim() };
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.totalCreatedUsers || req.query.totalCreatedUsersMax) {
    const qrU = {};
    if (req.query.totalCreatedUsers) {
      qrU.$gte = Number(req.query.totalCreatedUsers);
    }
    if (req.query.totalCreatedUsersMax) {
      qrU.$lte = Number(req.query.totalCreatedUsersMax);
    }
    filter.total_created_users = qrU;
  }
  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.verified) {
    filter.verified = {
      ...(req.query.verified === "true"
        ? { $eq: true }
        : { $in: [null, false] }),
    };
  }
  if (req.query.twoFA) {
    filter.twoFA = {
      ...(req.query.twoFA === "true"
        ? { $exists: true, $ne: "" }
        : { $in: [null, ""] }),
    };
  }

  if (req.query.backup_code) {
    filter.backup_code = {
      ...(+req.query.backup_code
        ? { $exists: true, $ne: "" }
        : { $in: [null, ""] }),
    };
  }

  if (req.query.elevenlabs_key) {
    filter.elevenlabs_key = {
      ...(+req.query.elevenlabs_key
        ? { $exists: true, $ne: "" }
        : { $in: [null, ""] }),
    };
  }

  if (req.query.verified_studio) {
    filter.verified_studio = req.query.verified_studio;
  }

  if (req.query.lastUpdate) {
    filter.updatedAt = {
      $lt: new Date(Date.now() - 1000 * 60 * Number(req.query.lastUpdate)),
    };
  }
  if (req.query.totalStartBat) {
    filter.total_bat = { $gte: Number(req.query.totalStartBat) };
  }
  if (req.query.totalEndBat) {
    filter.total_bat = { $lte: Number(req.query.totalEndBat) };
  }
  if (req.query.email) {
    filter.email = { $regex: req.query.email };
  }

  return filter;
};

// Phương thức để lấy thông tin Brave của profile
ProfileSchema.methods.getBraveInfo = function () {
  return {
    total_bat: this.total_bat,
    pid: this.id,
    is_disabled_ads: this.is_disabled_ads,
    count_brave_rounds: this.count_brave_rounds,
    brave_replay_ads_rounds: youtube_config.brave_replay_ads_rounds,
  };
};

module.exports = ProfileSchema;
