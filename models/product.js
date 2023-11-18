const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_id:{
    type:String,
    unique:true,
  },
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  blurb: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  productImages: [
    {
      type: String,
      default: " ",
    },
  ],
  color: {
    type: String,
    required: true,
  },
  size: {
    xs: {
      type: Number,
      default: 0,
    },
    s: {
      type: Number,
      default: 0,
    },
    m: {
      type: Number,
      default: 0,
    },
    l: {
      type: Number,
      default: 0,
    },
    xl: {
      type: Number,
      default: 0,
    },
  },
  brand: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required:true,
  },
  subcategory:{
    type:String,
    require:true
  },
  deleted:{
    type:Boolean,
    default:false,
  }
});

productSchema.pre("save", async function (next) {
  let uniqueCode;
  let isUnique = false;

  while (!isUnique) {
    const { nanoid } = await import("nanoid");
      uniqueCode = nanoid();
     const  existingProduct= await mongoose.model("products").findOne({ product_id: uniqueCode })
    isUnique = !existingProduct;
  }
    this.product_id = uniqueCode;
  next();
});

module.exports = mongoose.model("products", productSchema);
