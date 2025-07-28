const mongoose = require('mongoose')

let Schema = mongoose.Schema

let modelSchema = new Schema({
  content: { type: String, required: true },
  set_id: { type: String },
  set_code: { type: String },
}, { strict: false })

modelSchema.set('timestamps', false)

modelSchema.pre('save', async function (next) {
  if (this.isNew) {
    let set = await getModel('FBGroupSet').findOne({ _id: this.set_id })
    if (set) {
      this.set_code = set.code
    }
  }

  next()
})

// Thêm static method getRandomDocument vào schema
modelSchema.statics.getRandomDocument = async function (filter = {}) {
  const count = await this.countDocuments(filter); // Đếm số lượng documents thỏa mãn filter
  const random = Math.floor(Math.random() * count); // Chọn vị trí ngẫu nhiên
  return await this.findOne(filter).skip(random); // Lấy document tại vị trí ngẫu nhiên
};

module.exports = modelSchema
