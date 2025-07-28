const mongoose = require('mongoose')

let Schema = mongoose.Schema

let ContentRepoSchema = new Schema({
  content: String, 
  target: { type: String, default: '' },
  partner_id: String,
}, { strict: false })

ContentRepoSchema.set('timestamps', true)

ContentRepoSchema.statics.getRandomContent = async function (type, svID, partner_id) {
  let query = {}
  if (type) {
    if (svID) {
      query.target = svID
    } else {
      query['$or'] = [
        { target: type },
        { target: '' }
      ]
    }
  }

  if (partner_id) {
    query.partner_id = partner_id
  }

  let Comment = await getModel('ContentRepo')
  let countRs = await Comment.countDocuments(query)
  let randomPosition = Math.floor(Math.random() * countRs)
  let comment = await Comment.findOne(query).skip(randomPosition)

  if (comment) {
    return comment.content
  }
  return ''
}

module.exports = ContentRepoSchema
