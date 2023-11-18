const Wallet = require("../../models/wallet");
const User = require("../../models/user")
const Razorpay = require("razorpay");

const loadWallet = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id);
        const wallet = await Wallet.findOne({user:req.session.user_id})
        res.render("user/wallet", {
          user: userData,
          url: "wallet",
          wallet,
          cartCount: res.locals.count,
          wishCount: res.locals.wishlist,
        });
      } catch (error) {
        if (!req.session.user) {
          res.render("error404", { user: null, url: null, req:null});
        } else {
          res.render("error404", { user: req.session.user, cartCount: res.locals.count, wishCount: res.locals.wishlist,url: null, req:null});
        }
      }
}


module.exports={
    loadWallet,
}