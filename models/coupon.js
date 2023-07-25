const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        coupon_id:{
            type:String,
        },
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
        maxAmount:{
            type: Number,
            default: 0
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

couponSchema.pre("save", async function (next) {
    let uniqueCode;
    let isUnique = false;
  
    while (!isUnique) {
      const { nanoid } = await import("nanoid");
        uniqueCode = nanoid();
       const  existingCoupon= await mongoose.model("coupon").findOne({ coupon_id: uniqueCode })
      isUnique = !existingCoupon
    }
      this.coupon_id = uniqueCode;
    next();
  });

module.exports = mongoose.model("coupon", couponSchema);
