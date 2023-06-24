const Product = require("../models/product");
const Category = require("../models/category");

const loadShop = async (req, res) => {
  const pageSize = 9;
  const currentPage = parseInt(req.query.page) || 1;
  const count = await Product.countDocuments();
  const totalPages = Math.ceil(count / pageSize);
  const products = await Product.find({ quantity: { $ne: 0 } })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize);
  if (!req.session.user) {
    res.render("user/shop", {
      items: products,
      user: null,
      page: currentPage,
      totalPages: totalPages,
    });
  } else {
    res.render("user/shop", {
      items: products,
      user: req.session.user,
      page: currentPage,
      totalPages: totalPages,
    });
  }
};
const loadProduct = async (req, res) => {
  if (req.query.id) {
    const productID = req.query.id;
    const product = await Product.findOne({ _id: productID });

    if (product) {
      const products = await Product.find({ category: product.category }).limit(
        4
      );
      if (req.session.user) {
        res.render("user/product", {
          item: product,
          items: products,
          user: req.session.user,
        });
      } else {
        res.render("user/product", {
          item: product,
          items: products,
          user: null,
        });
      }
    } else {
      res.redirect("/shop");
    }
  } else {
    res.redirect("/shop");
  }
};

module.exports = {
  loadShop,
  loadProduct,
};
