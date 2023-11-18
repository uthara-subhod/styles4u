const Coupon = require('../../models/coupon')


//couponlist -get
const loadCoupons = async (req, res) => {
  try{
    
    const coupon = await Coupon.find()
        
      const totalUses = [];
      
      for (const c of coupon) {
        const uses = await Coupon.aggregate([
          {
            $match: {
              _id: c._id
            }
          },
          {
            $unwind: "$owner"
          },
          {
            $group: {
              _id: null,
              totalUses: { $sum: "$owner.uses" }
            }
          }
        ]);
        
        if (uses.length > 0) {
          totalUses.push(c.quantity+(uses[0].totalUses));
        }else{
            totalUses.push(c.quantity);
        }
        
    await c.save();
      }
    res.render('admin/coupons', { url: "coupon", coupon, totalUses})
  } catch(err){
    res.send(err)
  }
    
}


//coupon add -get
const loadCoupon = async (req, res) => {
  try{
    if(req.query.id){
      const coupon = await Coupon.findOne({coupon_id:req.query.id})
      res.render('admin/coupon', { url: "coupon", message: null, color: null ,coupon})
    }
    res.render('admin/coupon', { url: "coupon", message: null, color: null ,coupon:null})
  }catch(err){
    res.send(err)
  }
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
            maxAmount,
            limit,
            type,
            amount
        } = req.body
        let coupon = await Coupon.findOne({ couponCode:couponCode});
        if (coupon) {
            res.render('admin/coupon', { url: "coupon", message: "Coupon already exists", color: "red" ,coupon:null})
        } else {
            
            await Coupon.create({ couponName, couponCode, startDate, endDate, quantity, minSpend, maxAmount, limit, discount: { type, amount } }).then(() => {
                res.render('admin/coupon', { url: "coupon", message: "Coupon added!", color: "green" , coupon:null})
            });
        }
    } catch (error) {
        res.send(error)
    }
}


const editCoupon = async (req,res) =>{
    try {
        const {
            couponName,
            couponCode,
            startDate,
            endDate,
            quantity,
            minSpend,
            maxAmount,
            limit,
            type,
            amount
        } = req.body
        let coupon = await Coupon.findOne({coupon_id:req.query.id})
        let coupon1 = await Coupon.findOne({ couponCode:couponCode, coupon_id:{$ne:req.query.id}});

        if (coupon1) {
            res.render('admin/coupon', { url: "coupon", message: "Coupon already exists", color: "red" ,coupon:coupon})
        } else {
          let coupon2 = await Coupon.findOneAndUpdate({ coupon_id:req.query.id},{$set:{
            couponName, couponCode, startDate, endDate, quantity, minSpend, maxAmount, limit, discount: { type, amount }
          }},{new:true});
                res.render('admin/coupon', { url: "coupon", message: "Coupon edited!", color: "green" ,coupon:coupon2})
        }
    } catch (error) {
        res.send(error)
    }
}


const changeStatus = async (req,res) => {
    try{
     const coupon= await Coupon.findOneAndUpdate({ _id: req.query.id }, [{ $set: { status: { $eq: [false, "$status"] } } }]);
    res.json({status:true})
    }catch(err){
        res.send(err)
    }
    
}


module.exports = {
    loadCoupon,
    loadCoupons,
    addCoupon,
    changeStatus,
    editCoupon
}