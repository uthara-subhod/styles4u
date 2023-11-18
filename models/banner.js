const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    bannerImage: {
        type: String,
        default:'',
    },
    description: {
        type: String,
    },
    url: {
        type: String,
    },
});

const bannerModel = mongoose.model("banner", bannerSchema);

module.exports = bannerModel;