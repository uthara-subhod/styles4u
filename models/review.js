const mongoose = require("mongoose");


const reviewSchema = new mongoose.Schema({
    rating:{
        type:Number,
        min:0,
        max:5,
        default:0,
    },
    review:{
        type:String,
        required:true,
    },
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    reviewDate:{
        type:Date,
        default:Date.now(),
    }
})

module.exports = mongoose.model("reviews", reviewSchema);
