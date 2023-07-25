const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },

  walletID:{
    type:String,
    default:generateUniqueID
  },

  balance: {
    type: Number,
    default: 0,
  },

  history: [
    {
      updatedDate: {
        type: Date,
        default: Date.now(),
      },
      type: {
        type: String, // "add" or "deduct"
        enum: ["add", "subtract"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      newBalance: {
        type: Number,
        required: true,
      },
    },
  ]
});

function generateUniqueID() {
  const prefix = "WAL";
  const timestamp = Date.now();
  return `${prefix}-${timestamp}`;
}

module.exports = mongoose.model("wallet", walletSchema);
