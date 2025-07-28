const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let LogSchema = new Schema(
  {
    script_code: String,
    message: String,
  },
  { strict: false }
);

LogSchema.set("timestamps", true);

LogSchema.statics.add = async function (data) {
  await this.create(data);
};

module.exports = LogSchema;
