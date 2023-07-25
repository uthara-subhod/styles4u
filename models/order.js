const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        order_id: {
            type: String,
            unique: true,
          },
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
                returned:{
                    type:Number,
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
        razorpay_payment_id:{
            type:String,
        }
    },
);

orderSchema.pre("save", async function (next) {
    let uniqueCode;
    let isUnique = false;

    while (!isUnique) {
        const { nanoid } = await import("nanoid");
        uniqueCode = nanoid();
       const existingOrder= await mongoose.model("order").findOne({ order_id: uniqueCode })
      isUnique = !existingOrder;
    }
      this.order_id = uniqueCode;
    next();
  });

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
