const Order = require("../../models/order");
const User = require("../../models/user")
const Wallet = require('../../models/wallet')
const Razorpay=require('razorpay')

//dashboard -get
const loadDashboard = async (req, res) => {

  let filterValue = 30
  if(req.query.filter1){
    filterValue=parseInt(req.query.filter1)
  }

  const endDate = new Date(); 
  endDate.setDate(endDate.getDate() + 1); // Add 1 day to include today
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - filterValue);

  const daily = await Order.aggregate([
    {
      $match: {
        order_date: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$order_date"
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const category = await Order.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "productData"
      }
    },
    {
      $unwind: "$productData"
    },
    {
      $group: {
        _id: "$productData.category",
        count: { $sum: 1 }
      }
    },
  ]);

  const user = await User.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdDate"
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ])

  const orders = await Order.find().populate({ path: 'user' }).sort({ order_date: -1 }).limit(5);

  const userCount= await User.countDocuments()
  const orderCount = await Order.countDocuments()

  res.render('admin/dashboard', { url: "dashboard", daily , category, user, orders, userCount, orderCount});
};

  //sales report
  const report = async (req, res, next) => {
    try {
        let yearly = await Order.aggregate([
            {
                $match: { order_status: { $eq: "delivered" } },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$delivery_date" },
                    },
                    items: { $sum: { $size: "$items" } },
                    total: { $sum: "$total" },
                    count: { $sum: 1 },
                },
            },
        ]);
        res.render("admin/sales", { yearly ,url:'dashboard'});
    } catch (error) {
        console.log(error);
        next(error);
    }
  };


  //monthly
  const sales = async (req, res, next) => {
    try {
        let salesRe = await Order.aggregate([
            {
                $match: { order_status: { $eq: "delivered" } },
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$delivery_date" },
                    },
                    items: { $sum: { $size: "$items" } },
                    total: { $sum: "$total" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.month": 1 } },
        ]);
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const salesRep = salesRe.map((el) => {
            const newOne = { ...el };
            newOne._id.month = months[newOne._id.month - 1];
            return newOne;
        });
        res.json({ salesRep, error: false });
    } catch (error) {
        console.log(error);
        next(error);
    }
};


//daily
const daily = async (req, res, next) => {
  try {
      let daily = await Order.aggregate([
          { $match: { order_status: { $eq: "delivered" } } },
          {
              $group: {
                  _id: {
                      Year: { $year: "$delivery_date" },
                      Month: { $month: "$delivery_date" },
                      Day: { $dayOfMonth: "$delivery_date" },
                  },
                  Total: { $sum: "$total" },
                  items: { $sum: { $size: "$items" } },
                  count: { $sum: 1 },
              },
          },
          { $sort: { "_id.Year": -1, "_id.Month": 1, "_id.Day": 1 } },
      ]);
      res.json({ error: false, daily });
  } catch (error) {
      console.log(error);
      next(error);
  }
};


//monthly
const weekly = async (req, res, next) => {
  try {
      let weeksale = await Order.aggregate([
          {
              $match: { order_status: { $eq: "delivered" } },
          },
          {
              $group: {
                  _id: {
                      month: { $month: "$delivery_date" },
                  },
                  Total: { $sum: "$total" },
                  count: { $sum: 1 },
              },
          },
          { $sort: { "_id.month": 1 } },
      ]);

      const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
      ];
      const salesRep = weeksale.map((el) => {
          const newOne = { ...el };
          newOne._id.month = months[newOne._id.month - 1];
          return newOne;
      });
      res.json({ status: true, salesRep });
  } catch (error) {
      console.log(error);
      next(error);
  }
};

const razorpayInstance = new Razorpay({
  key_id: "rzp_test_lBhHdo9vOqWbPn",
  key_secret: "Y8eVWHfxOhAD2X6lau3YXtBj",
});

//orderlist -get
const loadOrders = async (req, res) => {
  try {

    const currentDate = new Date();

    const orders = await Order.find().sort({ order_date: -1 }).populate({ path: "user" })

    for (const order of orders) {
      const deliveryDate = order.delivery_date;

      if (currentDate >= deliveryDate) {
        if (order.payment_method == "cod" && order.payment_status=="pending") {
          order.order_status = "pay";
        } else {
          order.order_status = "delivered";
        }
        await order.save();
      }
    }

    res.render("admin/orders", {
      url: "order",
      order: orders,
    });
  } catch (err) {
    res.send("Error");
  }
};

//order -get
const loadOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.id }).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" },
    ]);
    if(order){
      let return1=order
    let return2={}
    return2.items=[]
    for(let i=0;i<order.items.length;i++){
      if(order.items[i].returned){
        let quantity=order.items[i].returned
        return1.items[i].quantity=quantity
        if(order.items[i].returned>0){
          return2.items.push(return1.items[i])
        }
      }
    }
    let order1=await Order.findOne({ order_id: req.params.id }).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" },
    ]);
    let order2=JSON.parse(JSON.stringify(order1))
    order2.order_date=new Date(order2.order_date)
    if(order2.delivery_date){
      order2.delivery_date=new Date(order2.delivery_date)
    }
    order2.items=[]
    for(let i=0;i<order1.items.length;i++){
      if(order1.items[i].returned){
        let quantity=order1.items[i].quantity-order1.items[i].returned
        order1.items[i].quantity=quantity
      }
        if(order1.items[i].quantity!=0){
          order2.items.push(order1.items[i])
        }
    }
    res.render("admin/order", {
      url: "order",
      order:order2,
      return1:return2
    });
  }} catch (err) {
    res.send(err);
  }
}


//order -post
const statusChange = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    const order = await Order.findOneAndUpdate({order_id:id}, {
      $set: { order_status: status },
    });
    if (status == "shipped") {
      const currentDate = new Date();
      if (order.delivery == 20) {
        var deliveryD = new Date(
          currentDate.getTime() + 4 * 24 * 60 * 60 * 1000
        );
      } else if (order.delivery == 10) {
        var deliveryD = new Date(
          currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
        );
      } else {
        var deliveryD = new Date(
          currentDate.getTime() + 12 * 24 * 60 * 60 * 1000
        );
      }
      await Order.findOneAndUpdate({order_id:id}, { $set: { delivery_date: deliveryD } });
    }else if (status=="rejected"){
      if(order.payment_method=='online'){
        const paymentId = order.razorpay_payment_id; // Payment ID of the order to be refunded
        const refundAmount = order.total * 100; // Refund amount in paise (Rupees * 100)

        razorpayInstance.payments.refund(
          paymentId,
          { amount: refundAmount },
          async (err, refund) => {
            if (!err) {
              order.payment_status = "refunded";
              await order.save();
              res.json({status: status});
            } else {
              res.json({ status: false});
            }
          }
        );
      }else if(order.payment_method=='wallet'){
        const userId = order.user;
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
          wallet = await new Wallet({
            user: userId,
            balance: order.total,
            history: [
              { type: "add", amount: order.total, newBalance: order.total },
            ],
          }).save();
          await User.findByIdAndUpdate(userId, {
            $set: { wallet: wallet._id },
          });
        } else {
          let balance = wallet.balance;
          let newBalance = balance + order.total;
          let history = {
            type: "add",
            amount: order.total,
            newBalance: newBalance,
          };
          wallet.balance = newBalance;
          wallet.history.push(history);
          await wallet.save();
        }
        order.payment_status = "refunded";
        await order.save();
        if (wallet) {
          res.json({ status: status });
        } else {
          res.json({ status: false });
        }
      }
    }
    res.json({status:status});
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadDashboard,
  loadOrders,
  loadOrder,
  statusChange,
  report,
  sales,
  daily,
  weekly,
};
