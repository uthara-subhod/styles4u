const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      image: [{
        type: String,
        default:'',
      }],
      brand: {
        type: String,
        default:'',
      },
      isAdmin: {
        type: Boolean,
        default: false,
      },
      access: {
        type: Boolean,
        default: true,
      },
})