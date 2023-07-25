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
        res.send(error);
      }
}


module.exports={
    loadWallet,
}