const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "address",
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products",
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
                size:{
                    type:String,
                    required:true,
                },
                totalPrice: {
                    type: Number,
                },
            },
        ],
        total: {
            type: Number,
            required:true,
        },
        delivery: {
            type: Number,
            default: 0,
        },
        order_status: {
            type: String,
        },
        payment_status: {
            type: String,
        },
        payment_method: {
            type: String,
        },
        order_date: {
            type: Date,
            default: Date.now(),
        },
        delivery_date:{
            type:Date,
        },
        coupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "coupon",
        },
        razorpay_order_id:{
            type:String,
        }
    },
);
const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
