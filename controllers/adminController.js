const Product = require("../models/product");
const Category = require("../models/category");
const User = require("../models/user");
const sharp=require('sharp')

const loadCustomers = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    console.log(search);
    const userDetails = await User.find({
      isAdmin: false,
      $or: [
        { email: { $regex: new RegExp(search, "i") } },
        { username: { $regex: new RegExp(search, "i") } },
      ],
    });

    res.render("admin/customers", { user: userDetails });
  } catch (error) {
    console.error(error.message);
  }
};
const loadEditCustomer = async (req, res) => {
  const id = req.query.id;
  const userDetails = await User.findById({ _id: id });
  if (userDetails) {
    res.render("admin/updateuser", { user: userDetails });
  } else {
    res.redirect("/admin/customer");
  }
};

const editCustomer = async (req, res) => {
  const userDetails = await User.findByIdAndUpdate(
    { _id: req.body._id },
    {
      $set: {
        access: req.body.access,
      },
    }
  );
  res.redirect("/admin/customer");
};
const loadCategory = async (req, res) => {
  const pageSize = 5;
  const currentPage = parseInt(req.query.page) || 1;

  try {
    const totalCategoriesCount = await Category.aggregate([
      { $unwind: "$sub" },
      { $count: "documentCount" },
    ]);
    const total = totalCategoriesCount[0].documentCount;
    const totalPages = Math.ceil(total / pageSize);

    const categories = await Category.aggregate([
      {
        $unwind: "$sub",
      },
      { $skip: (currentPage - 1) * pageSize },
      { $limit: pageSize },
    ]);

    res.render("admin/categories", {
      cat: categories,
      page: currentPage,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
};

const loadAddCategory = async (req, res) => {
  res.render("admin/addCategories", { message: null });
};
const addCategory = async (req, res) => {
  const { name, sub } = req.body;
  try {
    var existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    console.log(existingCategory);

    if (existingCategory) {
      if (sub === "") {
        return res.render("admin/addCategories", { message: "Already exists" });
      } else {
        var updatedCategory = await Category.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${name}$`, "i") } },
          { $addToSet: { sub: sub } },
          { upsert: true, new: true }
        );
        return res.redirect("/admin/categories");
      }
    } else {
      if (sub === "") {
        var category = new Category({ name: name });
        await category.save();
        return res.redirect("/admin/categories");
      } else {
        var category = new Category({ name: name, sub: [sub] });
        await category.save();
        return res.redirect("/admin/categories");
      }
    }
  } catch (error) {
    console.error("Error adding category:", error);
    // Handle the error and send an appropriate response
    return res.status(500).send("Internal Server Error");
  }
};

const loadProducts = async (req, res) => {
  const products = await Product.find();
  const count = products.length;
  const totalPages = Math.round(count / 9);
  if (req.query.page) {
    var page = req.query.page;
    j;
  } else {
    var page = 1;
  }

  res.render("admin/products", {
    items: products,
    page: page,
    totalPages: totalPages,
  });
};
const loadAddProduct = async (req, res) => {
  const categories = await Category.aggregate([
    {
      $unwind: "$sub",
    },
  ]);
  res.render("admin/addProducts", { message: null, cat: categories });
};
const AddProduct = async (req, res) => {
  const cat = req.body.category.split(",");
  console.log(cat)
  const category = await Category.findOne({ name: cat[0], sub: cat[1] });
  if (category) {
    const files = req.files;
    const images = [];
    files.forEach((file) => {
      images.push("/images/temp/"+file.filename);
    });
    const quantity =
      req.body.xs + req.body.s + req.body.m + req.body.l + req.body.xl;
      console.log(quantity)
    const product = await Product.findOneAndUpdate(
      { productName: req.body.name, category: category._id },
      {
        $set: {
          price: req.body.price,
          details: req.body.details,
          blurb: req.body.blurb,
          quantity: quantity,
          productImages: images,
          color: req.body.color,
          size: {
            xs: req.body.xs,
            s: req.body.s,
            m: req.body.m,
            l: req.body.l,
            xl: req.body.xl,
          },
          brand: req.body.brand,
        },
      },{
        upsert:true
      }
    );
    res.redirect('/admin/products')
  }
  else{
    res.send("OOps")
  }
};

module.exports = {
  loadCustomers,
  loadCategory,
  loadAddCategory,
  addCategory,
  loadEditCustomer,
  editCustomer,
  loadProducts,
  loadAddProduct,
  AddProduct,
};
