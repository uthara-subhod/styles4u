const Product = require("../../models/product");
const Category = require("../../models/category");


//home -get
const loadHome = async (req, res) => {
  try {
    const categories = await Category.find()
    const name = categories.map(category => category.name)
    const products = await Product.find({ category: { $in: name } })
    const productValue = [];

    for (let i = 0; i < categories.length; i++) {
      productValue[i] = await Product.findOne({
        category: categories[i].name,
      });
    }

    if (!req.session.user) {
      res.render("home", { user: null, cat: categories, url: '/', productValue, products });
    } else {
      res.render("home", { user: req.session.user, cat: categories, url: '/', cartCount: res.locals.count, wishCount: res.locals.wishlist, products, productValue });
    }
  } catch (err) {
    res.send(err)
  }

};


//shop-get
const loadShop = async (req, res) => {
  try {
    const categories = await Category.find()
    let search = "";
    const pageSize = 12;
    let minPrice = 100
    let maxPrice = 5000

    if (req.query.price) {
      [minPrice, maxPrice] = req.query.price.split(';');
    }
    if (req.query.search) {
      search = req.query.search;
    }

    let query = {
      quantity: { $gt: 0 },
      price: { $gte: minPrice, $lte: maxPrice },
      deleted: { $ne: true },
      $or: [
        { productName: { $regex: new RegExp(`\\b${search}`, "i") } },
        { color: { $regex: new RegExp(`\\b${search}`, "i") } },
      ],
    };

    if (req.query.color) {
      query.color = req.query.color
    }
    if (req.query.size) {
      query[`size.${req.query.size}`] = { $gt: 0 };
    }
    if (req.query.name) {
      query.category = req.query.name
    }
    if (req.query.sub) {
      query.subcategory = req.query.sub
    }

    const currentPage = parseInt(req.query.page) || 1;
    const count = await Product.countDocuments();
    const totalPages = Math.ceil(count / pageSize);
    const products = await Product.find(query)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    if (!req.session.user) {
      res.render("user/shop", {
        items: products,
        user: null,
        page: currentPage,
        totalPages: totalPages,
        cat: categories,
        url: '/shop'
      });
    } else {
      res.render("user/shop", {
        items: products,
        user: req.session.user,
        page: currentPage,
        totalPages: totalPages,
        cat: categories,
        url: '/shop',
        cartCount: res.locals.count, wishCount: res.locals.wishlist
      });

    }
  } catch (err) {
    res.send(err)
  }

};


//product-get
const loadProduct = async (req, res) => {
  try {
    const categories = await Category.find()

    if (req.query.id) {
      const productID = req.query.id;
      const product = await Product.findOne({ _id: productID });

      if (product) {
        const products = await Product.find({ _id: { $ne: product._id }, category: product.category }).limit(4);

        if (req.session.user) {
          res.render("user/product", {
            item: product,
            items: products,
            user: req.session.user,
            cat: categories,
            url: '/shop',
            cartCount: res.locals.count, wishCount: res.locals.wishlist
          });
        } else {
          res.render("user/product", {
            item: product,
            items: products,
            user: null,
            cat: categories,
            url: '/shop',

          });
        }
      } else {
        res.redirect("/shop");
      }
    } else {
      res.redirect("/shop");
    }

  } catch (err) {
    res.send(err)
  }

};


module.exports = {
  loadHome,
  loadShop,
  loadProduct,
};
