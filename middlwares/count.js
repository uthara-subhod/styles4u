const cartModel = require("../models/cart");
const wishlistModel = require("../models/wishlist");

const countCart = (req, res, next) => {
    if (req.session.user) {
        cartModel.findOne({ owner: req.session.user_id }).then((data) => {
            if (data) {
                if (data.items.length > 0) {
                    let lengths = data.items.length;
                    res.locals.count = lengths;
                    next();
                } else {
                    res.locals.count = 0;
                    next();
                }
            } else {
                res.locals.count = 0;
                next();
            }
        });
    } else {
        next();
    }
};

const wishlistCount = (req, res, next) => {
    if (req.session.user) {
        wishlistModel.findOne({ user: req.session.user_id }).then((data) => {
            if (data) {
                if (data.items.length > 0) {
                    let lengths = data.items.length;
                    res.locals.wishlist = lengths;
                    next();
                } else {
                    res.locals.wishlist = 0;
                    next();
                }
            } else {
                res.locals.wishlist = 0;
                next();
            }
        });
    } else {
        next();
    }
};

module.exports = { countCart, wishlistCount };
