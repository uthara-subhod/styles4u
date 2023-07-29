const Product = require("../../models/product");
const Category = require("../../models/category");
const Banner =require("../../models/banner")
const Review =require("../../models/review")



//home -get
const loadHome = async (req, res) => {
  try {
    const banner= await Banner.find()
    const categories = await Category.find()
    const name = categories.map(category => category.name)
    const products = await Product.find()
    const productValue = [];
    let k=0
    let exists
    for(let i=0;i<categories.length;i++){
      exists=false
      for(let j=0;j<products.length;j++){
        if(products[j].category==categories[i].name){
          exists=true
          break;
        }
      }
      if(!exists){
        categories[i]=null
      }
    }
    for (let i = 0; i < categories.length; i++) {
      if(categories[i]){
        for (let j=0;j< categories[i].sub.length;j++){
          productValue[k] = await Product.findOne({
            category: categories[i].name,
            subcategory: categories[i].sub[j]
          },{category:1, subcategory:1});
          k++;
        }
      }
     
    }

    if (!req.session.user) {
      res.render("home", { user: null, cat: categories, url: '/', productValue, products , banner,req});
    } else {
      res.render("home", { user: req.session.user, cat: categories, url: '/', cartCount: res.locals.count, wishCount: res.locals.wishlist, products, productValue, banner ,req});
    }
  } catch (err) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null,req});
    } else {
      res.render("error404", { user: req.session.user, url: null,});
    }
  }

};


//shop-get
const loadShop = async (req, res) => {
  try {
    const categories = await Category.find();
let search = "";
const pageSize = 12;
let minPrice = 100;
let maxPrice = 5000;

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
};

if (search) {
  query.$or = [
    { productName: { $regex: new RegExp(`\\b${search}`, "i") } },
    { color: { $regex: new RegExp(`\\b${search}`, "i") } },
  ];
}

if (req.query.color) {
  query.color = req.query.color;
}
if (req.query.size) {
  query[`size.${req.query.size}`] = { $gt: 0 };
}

if(req.query.sub) {
  const name = Array.isArray(req.query.sub) ? req.query.sub.map((element) => element.split('|')[0]) : [req.query.sub.split('|')[0]];
  const sub = Array.isArray(req.query.sub) ? req.query.sub.map((element) => element.split('|')[1]) : [req.query.sub.split('|')[1]];
  const cat =Array.isArray(req.query.name) ? req.query.name : [req.query.name]
if(!query.$or){
  query.$or = [];
}
  for (let i = 0; i < name.length; i++) {
    query.$or.push({
      $and: [
        { category: name[i] },
        { subcategory: sub[i] }
      ]
    });
  }
  for(let i=0;i<cat.length;i++){
    if(name.includes(cat[i])){
      cat[i]=''
    }
  }
  console.log(cat)
  for(c of cat){
    if(c!=''){
      query.$or.push({
        category: c,
   });
    }
    
  }
} else{
  if(req.query.name){
    const name =Array.isArray(req.query.name) ? req.query.name : [req.query.name]
    if(!query.$or){
      query.$or = [];
    }
    for (let i = 0; i < name.length; i++) {
      query.$or.push(
          { category: name[i] },
      );
    }
  }
}



const currentPage = parseInt(req.query.page) || 1;
const count = await Product.countDocuments(query);
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
        url: '/shop',
        req
      });
    } else {
      res.render("user/shop", {
        items: products,
        user: req.session.user,
        page: currentPage,
        totalPages: totalPages,
        cat: categories,
        url: '/shop',
        cartCount: res.locals.count, wishCount: res.locals.wishlist,
        req
      });

    }
  } catch (err) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }

};


//product-get
const loadProduct = async (req, res) => {
  try {
    const categories = await Category.find()
    
    
    if (req.query.id) {
      const productID = req.query.id;
      const product = await Product.findOne({product_id:productID});

      if (product) {
        const reviews = await Review.aggregate([
          { $match: { product: product._id } },
          {
            $lookup: {
              from: "users", // Name of the "users" collection
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user", // Deconstruct the "user" array
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              reviews: { $push: "$$ROOT" },
              totalReviews: { $sum: 1 },
            },
          },
        ]);
        if(!reviews[0]){
          reviews.push({averageRating:0, totalReviews:0,reviews:[]})
        }
        const products = await Product.find({ _id: { $ne: product._id }, category: product.category }).limit(4);

        if (req.session.user) {
          res.render("user/product", {
            item: product,
            items: products,
            user: req.session.user,
            cat: categories,
            url: '/shop',
            cartCount: res.locals.count, wishCount: res.locals.wishlist,
            reviews,
            req
          });
        } else {
          res.render("user/product", {
            item: product,
            items: products,
            user: null,
            cat: categories,
            url: '/shop',
            reviews,
            req
          });
        }
      } else {
        if (!req.session.user) {
          res.render("error404", { user: null, url: null, req:null});
        } else {
          res.render("error404", { user: req.session.user, url: null, req:null});
        }
      }
    } else {
      res.redirect("/shop");
    }

  } catch (err) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }

};

const loadReturnP= async (req,res) =>{
 try{
  let user=null
  if(req.session.user){
    user=req.session.user
  }
  res.render("returnPolicy", { user: user, url: null, req:null});
 }catch(err){
  if (!req.session.user) {
    res.render("error404", { user: null, url: null, req:null});
  } else {
    res.render("error404", { user: req.session.user, url: null, req:null});
  }
}
 }

 const loadCancelP= async (req,res) =>{
  try{
   let user=null
   if(req.session.user){
     user=req.session.user
   }
   res.render("cancelPolicy", { user: user, url: null, req:null});
  }catch(err){
   if (!req.session.user) {
     res.render("error404", { user: null, url: null, req:null});
   } else {
     res.render("error404", { user: req.session.user, url: null, req:null});
   }
 }
  }



module.exports = {
  loadHome,
  loadShop,
  loadProduct,
  loadReturnP,
  loadCancelP
};
