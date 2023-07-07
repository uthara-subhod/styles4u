const mongoose = require("mongoose");
const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "products",
            },
        },
    ],
});

const wishlistModel = mongoose.model("wishlist", wishlistSchema);
module.exports = wishlistModel;