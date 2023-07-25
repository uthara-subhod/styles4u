const Cart = require("../../models/cart");
const Category = require("../../models/category");
const Product = require("../../models/product");


//cart -get
const loadCart = async (req, res, next) => {
  try {
    const categories = await Category.find();
    const user = req.session.user_id;
    const cartItems = await Cart.findOne({ owner: user }).populate(
      "items.productId"
    );
    if(cartItems){
    for (const item of cartItems.items) {
      if (item.productId.size[item.size] < item.quantity) {
        item.quantity = item.productId.size[item.size];
        await cartItems.save();
      }
    }
  }
    res.render("user/cart", {
      cat: categories,
      url: null,
      user: req.session.user,
      cartItems: cartItems,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};



//add product to cart
const addToCart = async (req, res, next) => {
  try {
    let userId = req.session.user_id;
    let response = null;
    let productId = req.body.id;
    let Size = req.body.size;
    let size = Size.toLowerCase();
    const findProduct = await Product.findOne({
      _id: productId,
      [`size.${Size.toLowerCase()}`]: { $gt: 0 },
    });
    let findUser = await Cart.findOne({ owner: userId });

    if (findProduct) {

      if (!findUser) {
        let addCart = await Cart.create({
          owner: userId,
          items: [
            {
              productId: findProduct._id,
              size: size,
              totalPrice: findProduct.price,
            },
          ],
          cartPrice: findProduct.price,
        }).then((data) => {
          res.json({ response: true });
        });
      } else {

        if (findUser) {
          let productExist = await Cart.findOne({
            owner: userId,
            "items.productId": productId,
            "items.size": size,
          });

          if (productExist) {
            res.json({ response: "productExist" });
          } else {
            const newProduct = await Cart.findOneAndUpdate(
              { owner: userId },
              {
                $push: {
                  items: {
                    productId: findProduct._id,
                    size: size,
                    totalPrice: findProduct.price,
                  },
                },
                $inc: {
                  cartPrice: findProduct.price,
                },
              }
            ).then((data) => {
              res.json({ response: true });
            });
          }
        } else {
          console.log("error");
        }
      }
    } else {
      res.json({ response: "outofstock" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


//change quantity of a product in cart
const quantityChange = async (req, res, next) => {
  try {
    let userId = req.session.user_id;
    let cart = await Cart.findOne({ _id: req.body.cartId });
    const products = await Product.findOne({ _id: req.body.productId });
    productPrice = products.price;
    const cartCount = req.body.count;

    if (cartCount == 1) {
      const index = cart.items.findIndex(
        (obj) => obj.productId == req.body.productId
      );
      
      if (cart.items[index].quantity >= products.size[req.body.size]) {
        res.json({ stock: true });
        return;
      } else {
        var productPrice = products.price;
      }
    } else {
      var productPrice = -products.price;
    }

    let updateCart = await Cart.findOneAndUpdate(
      { _id: req.body.cartId, "items.productId": req.body.productId },
      {
        $inc: {
          "items.$.quantity": cartCount,
          "items.$.totalPrice": productPrice,
          cartPrice: productPrice,
        },
      }
    );

    let index = updateCart.items.findIndex(
      (objItems) => objItems.productId == req.body.productId
    );
    let newCart = await Cart.findOne({ _id: req.body.cartId });
    let qty = newCart.items[index].quantity;
    let totalPrice = newCart.items[index].totalPrice;
    let cartPrice = newCart.cartPrice;

    res.json({ qty, totalPrice, cartPrice });
  } catch (error) {
    console.log(error);
  }
};


//delete product from cart
const deleteCart = async (req, res, next) => {
  let userId = req.session.user_id;
  try {
    let prodctId = req.query.productId;
    let size = req.query.size;
    const product = await Product.findOne({ _id: prodctId });
    const cart = await Cart.findOne({
      owner: userId,
      "items.productId": product,
    });
    const index = cart.items.findIndex((val) => {
      return val.productId == prodctId && val.size == size;
    });
    const price = cart.items[index].totalPrice;
    const cartTotal = product.price;
    const deletecart = await Cart.updateOne(
      { owner: userId },
      {
        $pull: {
          items: {
            productId: prodctId,
            size: size,
          },
        },
        $inc: { cartPrice: -price },
      }
    );
    res.json({ response: true });
  } catch (error) {
    console.log(error);
    next(error);
  }
};


module.exports = {
  loadCart,
  addToCart,
  quantityChange,
  deleteCart,
};
