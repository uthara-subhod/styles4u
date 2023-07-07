const Coupon = require('../../models/coupon')


//couponlist -get
const loadCoupons = async (req, res) => {
    const count = await Coupon.countDocuments();
    const totalPages = Math.ceil(count / 7);
    if (req.query.page) {
        var page = parseInt(req.query.page) || 1;
    } else {
        var page = 1;
    }
    let search = "";
    if (req.query.search) {
        search = req.query.search;
    }
    const coupon = await Coupon.find({ couponName: { $regex: new RegExp(search, "i") } },
    ).skip((page - 1) * 5)
    .limit(5);
    res.render('admin/coupons', { url: "coupon", coupon,page,totalPages, })
}


//coupon add -get
const loadCoupon = async (req, res) => {
    res.render('admin/coupon', { url: "coupon", message: null, color: null })
}


//coupon add -post
const addCoupon = async (req, res) => {
    try {
        const {
            couponName,
            couponCode,
            startDate,
            endDate,
            quantity,
            minSpend,
            limit,
            type,
            amount
        } = req.body
        let coupon = await Coupon.findOne({ couponCode:couponCode});
        if (coupon) {
            res.render('admin/coupon', { url: "coupon", message: "Coupon already exists", color: "red" })
        } else {
            
            await Coupon.create({ couponName, couponCode, startDate, endDate, quantity, minSpend, limit, discount: { type, amount } }).then(() => {
                res.render('admin/coupon', { url: "coupon", message: "Coupon added!", color: "green" })
            });
        }
    } catch (error) {
        res.send(error)
    }
}


module.exports = {
    loadCoupon,
    loadCoupons,
    addCoupon
}