const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        owner: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "user",
                },
                uses: {
                    type: Number,
                    default: 1,
                },
            },
        ],

        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        couponName: {
            type: String,
            required: true,
        },
        couponCode: {
            type: String,
            required: true,
        },
        discount: {
            type:{
                type:String,
                required:true,
            },
            amount:{
                type:Number,
                required:true,
            },
        },
        quantity: {
            type: Number,
        },
        minSpend: {
            type: Number,
            default: 0,
        },
        status: {
            type: Boolean,
            default: true,
        },
        limit: {
            type:Number,
            required:true,
        }
    },
);

module.exports = mongoose.model("coupon", couponSchema);
