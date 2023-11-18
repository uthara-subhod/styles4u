const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      size: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      totalPrice: {
        type: Number,
      },
      date: {
        type: Date,
        default: Date.now(),
      },
      itemId: {
        type: String,
        default: generateUniqueID,
      },
    },
  ],
  cartPrice: {
    type: Number,
    defualt: 0,
  },
});

function generateUniqueID() {
    const prefix = "CART";
    const timestamp = Date.now();
    return `${prefix}-${timestamp}`;
  }

const cartModel = mongoose.model("Cart", cartSchema);
module.exports = cartModel;
