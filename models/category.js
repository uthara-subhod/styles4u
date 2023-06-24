const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sub: {
    type: Array,
    required:true,
  },
});

module.exports = mongoose.model("categories", categorySchema);
