const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const KeySchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      index: true, // Thêm index cho trường key
    },
    type: {
      type: String,
      index: true, // Thêm index cho trường type vì thường xuyên query
    },
    status: String,
    lastUsed: {
      type: Date,
      default: null,
      index: true,
    },
    useCount: {
      type: Number,
      default: 0,
    },
  },
  {
    strict: false,
    timestamps: false,
  }
);

// Tạo compound index cho các trường thường query cùng nhau
KeySchema.index({ type: 1, status: 1 });

// Cache để lưu số lượng key theo type
const keyCountCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

// Hàm để lấy và cập nhật cache
async function getKeyCount(model, type) {
  const now = Date.now();
  const cacheKey = `${type}`;
  const cached = keyCountCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.count;
  }

  const count = await model.countDocuments({ type });
  keyCountCache.set(cacheKey, {
    count,
    timestamp: now,
  });

  return count;
}

// Tối ưu hàm getRandomKey
KeySchema.statics.getRandomKey = async function (type) {
  try {
    const count = await getKeyCount(this, type);
    if (count === 0) return "";

    // Sử dụng aggregation để lấy random document hiệu quả hơn
    const [key] = await this.aggregate([
      { $match: { type } },
      { $sample: { size: 1 } },
    ]);

    if (!key) return "";

    // Cập nhật thông tin sử dụng
    await this.updateOne(
      { _id: key._id },
      {
        $set: { lastUsed: new Date() },
        $inc: { useCount: 1 },
      }
    );

    return key.key;
  } catch (error) {
    console.error("Error in getRandomKey:", error);
    return "";
  }
};

// Thêm các phương thức hữu ích khác
KeySchema.statics.getKeyWithLeastUsage = async function (type) {
  const key = await this.findOne({ type }).sort({ useCount: 1 }).limit(1);
  return key ? key.key : "";
};

// Thêm method để rotate keys
KeySchema.statics.rotateKey = async function (type) {
  const keys = await this.find({ type }).sort({ lastUsed: 1 }).limit(1);
  return keys.length ? keys[0].key : "";
};

// Middleware để invalidate cache khi có thay đổi
KeySchema.post("save", function () {
  keyCountCache.clear();
});

KeySchema.post("remove", function () {
  keyCountCache.clear();
});

// Thêm method kiểm tra health của keys
KeySchema.statics.checkKeyHealth = async function (type) {
  const stats = await this.aggregate([
    { $match: { type } },
    {
      $group: {
        _id: null,
        totalKeys: { $sum: 1 },
        avgUsage: { $avg: "$useCount" },
        maxUsage: { $max: "$useCount" },
        minUsage: { $min: "$useCount" },
      },
    },
  ]);
  return stats[0] || null;
};

module.exports = KeySchema;
