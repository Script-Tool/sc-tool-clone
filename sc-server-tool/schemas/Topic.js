const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let Topic = new Schema(
  {
    id: Number,
    name: { type: String, required: true },
    code: String,
    region: String,
    parent_topic_code: String,
  },
  { strict: false }
);

Topic.set('timestamps', false);

Topic.pre('save', async function (next) {
  if (this.isNew) {
    let ID = getModel('ID');
    let newID = await ID.next('Topic');
    this.id = newID;

    if (!this.code) {
      this.code = this.name + this.id;
    }
  }

  next();
});

module.exports = Topic;
