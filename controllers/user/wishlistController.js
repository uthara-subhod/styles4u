const Wishlist=require('../../models/wishlist')
const Category=require('../../models/category')
const Product=require('../../models/product')


//wishlist -get
const loadWishlist = async (req, res, next) => {
    const categories=await Category.find()
    let user= req.session.user_id;
    try {
        let wishlist = await Wishlist.findOne({ user: user }).populate("items.product");
        res.render("user/wishlist", { cat:categories,url:null,user:req.session.user,wishlist:wishlist,cartCount:res.locals.count ,wishCount:res.locals.wishlist });
    } catch (error) {
        console.log(error);
        next(error);
    }
};


//wishlist -add product
const addToWishlist = async (req, res, next) => {
    let userId = req.session.user_id;
    let response = null;
    let productId = req.body.id;
    const findProduct = await Product.findOne({ _id: productId });
    let findUser = await Wishlist.findOne({ user: userId });
    try {
        if (!findUser) {
            await Wishlist .create({ user: userId, items: [ { product: findProduct._id, }] ,})
                .then((data) => {
                    res.json({ response: true });
                });
        } else {
            if (findUser) {
                let productExist = await Wishlist.findOne({ user: userId, "items.product": productId });
                if (productExist) {
                    res.json({ response: "productExist" });
                } else {
                    const newProduct = await Wishlist
                        .findOneAndUpdate(
                            { user: userId },
                            {
                                $push: {
                                    items: {
                                        product: findProduct._id,
                                    },
                                },
                            }
                        )
                        .then((data) => {
                            res.json({ status: true });
                        });
                }
            } else {
                console.log("error");
            }
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
};


//wishlist -delete product
const deleteWishlist = async (req, res, next) => {
    let userId = req.session.user_id;
    let prodctId = req.query.productId;
    try {
        const deleteWishList = await Wishlist.findOneAndUpdate(
            { user: userId },
            {
                $pull: {
                    items: {
                        product: prodctId,
                    },
                },
            }
        );
        res.json({ status: true });
    } catch (error) {
        console.log(error);
        next(error);
    }
};


module.exports={
    loadWishlist,
    addToWishlist,
    deleteWishlist
}