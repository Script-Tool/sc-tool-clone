const mongoose = require('mongoose')

let Schema = mongoose.Schema

let CommentSchema = new Schema({
  content: String, 
  target: { type: String, default: '' },
  partner_id: String,
}, { strict: false })

CommentSchema.set('timestamps', true)

CommentSchema.statics.getRandomComment = async function (type, svID, partner_id) {
  try {
    let query = {};
    if (type) {
      if (svID) {
        query.target = svID;
      } else {
        query.target = type;
      }
    }

    if (partner_id) {
      query.partner_id = partner_id;
    }

    const Comment = await getModel('Comment');
    const comment = await Comment.aggregate([
      { $match: query },
      { $sample: { size: 1 } },
      { $project: { content: 1 } }
    ]);

    return comment.length > 0 ? comment[0].content : '';
  } catch (error) {
    console.error('Lỗi khi lấy comment ngẫu nhiên:', error);
    return ''; // Hoặc throw error để xử lý ở nơi khác
  }
};


module.exports = CommentSchema
