const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let CountrySchema = new Schema(
  {
    id: { type: String, unique: true },
    name: { type: String },
    key: { type: String },
    type: { type: String },
  },
  { strict: false, timestamps: true }
);

module.exports = CountrySchema;
