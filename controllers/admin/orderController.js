const Order = require("../../models/order");


//orderlist -get
const loadOrders = async (req, res) => {
  try {
    const currentDate = new Date();

    const orders = await Order.find().sort({ order_date: -1 }).populate({ path: "user" });

    for (const order of orders) {
      const deliveryDate = order.delivery_date;

      if (currentDate >= deliveryDate) {
        if (order.payment_method == "cod") {
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
  loadOrders,
  loadOrder,
  statusChange,
};
