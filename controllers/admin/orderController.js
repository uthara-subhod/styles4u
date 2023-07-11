const Order = require("../../models/order");
const User = require("../../models/user")

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

  const orders = await Order.find()
  .populate({ path: 'user' })
  .sort({ order_date: -1 })
  .limit(5);

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
        console.log(yearly)
        res.render("admin/sales", { yearly ,url:'dashboard'});
    } catch (error) {
        console.log(error);
        error.admin = true;
        next(error);
    }
  };


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
        error.admin = true;
        next(error);
    }
};

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
      console.log(daily, 111);
      res.json({ error: false, daily });
  } catch (error) {
      console.log(error);
      error.admin = true;
      next(error);
  }
};

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
      error.admin = true;
      next(error);
  }
};



//orderlist -get
const loadOrders = async (req, res) => {
  try {
    const count =await Order.countDocuments() ;
        const totalPages = Math.round(count / 7);
        if (req.query.page) {
          var page = parseInt(req.query.page) || 1;
        } else {
          var page = 1;
        }
    const currentDate = new Date();

    const orders = await Order.find().sort({ order_date: -1 }).populate({ path: "user" }).skip((page - 1) * 7)
    .limit(7);

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
      page,totalPages,
    });
  } catch (err) {
    res.send("Error");
  }
};

//order -get
const loadOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate([
      { path: "user" },
      { path: "address" },
      { path: "items.productId" },
    ]);
    res.render("admin/order", {
      url: "order",
      order,
    });
  } catch (err) {
    res.send(err);
  }
};

//order -post
const statusChange = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    const order = await Order.findByIdAndUpdate(id, {
      $set: { order_status: status },
    });
    if (status == "shipped") {
      const currentDate = new Date();
      console.log(currentDate);
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
      console.log(deliveryD);
      await Order.findByIdAndUpdate(id, { $set: { delivery_date: deliveryD } });
    }
    res.json(status);
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
