const Cart = require("../../models/cart");
const Category = require("../../models/category");
const Address = require("../../models/address");
const Order = require("../../models/order");
const User = require("../../models/user");
const Product = require("../../models/product")
const Coupon = require("../../models/coupon")
const Razorpay = require('razorpay');


const razorpayInstance = new Razorpay({
  key_id: "rzp_test_lBhHdo9vOqWbPn",
  key_secret: "Y8eVWHfxOhAD2X6lau3YXtBj"
});


//checkout-get
const loadCheckout = async (req, res) => {
  try {
    const categories = await Category.find();
    const user = req.session.user_id;
    const cartItems = await Cart.findOne({ owner: user }).populate(
      "items.productId"
    );
    const addresses = await Address.find({ user: user, type: { $ne: "temp" } });
    res.render("user/checkout", {
      cat: categories,
      url: null,
      cartItems,
      addresses,
      user: req.session.user,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
    });
  } catch (err) {
    res.send(err);
  }
};


//checkout-add address
const shippingAddress = async (req, res) => {
  try {
    const user = req.session.user_id;
    const username = req.session.user;
    const info = req.body.info;
    const address = new Address({
      user: user,
      type: "temp",
      buildingName: info.building,
      street: info.street,
      city: info.city,
      state: info.state,
      zipCode: info.zip,
      country: info.country,
      phoneNumber: info.phone,
    });
    const add = await address.save();
    res.json({ add });
  } catch (err) {
    res.send(err);
  }
};


//checkout-post
const checkout = async (req, res, next) => {
  try {
    const categories = await Category.find();
    let userId = req.session.user_id;
    let cartId = req.query.id;
    let cartcount = res.locals.count;
    let findCart = await Cart.findOne({ owner: userId });
    let cartItem = findCart.items;
    if (cartItem == 0) {
      res.redirect("/cart");
    } else {
      const address_id = req.body.orderAddress;
      const payment = req.body.paymentMode;
      const totalPrice = parseInt(req.body.total);
      const delivery = parseInt(req.body.shippingMethod);
      if (req.body.couponId) {
        var order = await new Order({
          user: userId,
          address: address_id,
          items: cartItem,
          total: totalPrice,
          delivery: delivery,
          payment_method: payment,
          payment_status: "pending",
          order_status: "pending",
          coupon: req.body.couponId
        }).save();
        const coupon = await Coupon.findById(order.coupon);
        console.log(coupon)
        if (coupon) {
          const ownerIndex = coupon.owner.findIndex(
            (owner) => owner.user.toString() === userId
          );
          if (ownerIndex !== -1) {
            if (coupon.owner[ownerIndex].uses <= coupon.limit) {
              coupon.owner[ownerIndex].uses += 1;
              await coupon.save();
            }
          } else {
            coupon.owner.push({ user: userId });
            await coupon.save();
          }
        }



      } else {
        var order = await new Order({
          user: userId,
          address: address_id,
          items: cartItem,
          total: totalPrice,
          delivery: delivery,
          payment_method: payment,
          payment_status: "pending",
          order_status: "pending",
        }).save();
      }
      if (order) {
        await User.findByIdAndUpdate(userId, { $inc: { totalOrders: 1 } });
        await Cart.findOneAndDelete({ owner: userId });

        for (item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              [`size.${item.size}`]: -item.quantity,
              quantity: -item.quantity
            }
          })
        }

        res.render("user/checkoutSuccess", {
          cat: categories,
          url: null,
          user: req.session.user,
          cartCount: res.locals.count,
          wishCount: res.locals.wishlist,
          order
        });
      }
      else {
        res.send("oops")
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// online payment razorpay-checkout post
const checkoutPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.body.id)
    if (order) {
      const options = {
        amount: order.total * 100, // Amount in paise (Rupees * 100)
        currency: "INR",
        receipt: order._id, // Unique order receipt ID
        payment_capture: 1, // Automatically capture the payment
      };

      razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
        if (!err) {
          // order.razorpay_order_id = razorpayOrder.id
          // order.payment_status = "completed"
          // await order.save()
          res.json({
            status:true,
            id:order._id,
            order_id: razorpayOrder.id,
            amount: order.total,
            key_id: "rzp_test_lBhHdo9vOqWbPn",
            msg: 'Order Created'
          })
        } else {
          res.json({status:false})
        }
      })
    }
  } catch (err) {
    res.send(err)
  }
}

const placeOrder = async (req,res) => {
  const order_id= req.body.orderId
  const paymentId= req.body.paymentId
  const order = await Order.findOneAndUpdate({_id:order_id},{$set:{razorpay_payment_id:paymentId,payment_status:"completed"}}, { new: true })
  console.log(order)
  if(order){
    res.json({status:true})
  }else{
    res.json({status:false})
  }
}

//checkout choose-shipping
const shippingCharge = async (req, res, next) => {
  try {
    let userID = req.session.user_id;
    let id = await Cart.findOne({ owner: userID });
    let charge = req.body.id;
    let cartPrice = id.cartPrice;
    if (id) {
      let adding = charge + cartPrice;
      res.json({ charge, adding });
    } else {
      res.json((response = "charge"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


//orderlist -get
const loadOrderDetails = async (req, res) => {
  try {
    const user = req.session.user_id;
    const userData = await User.findById(user);
    const Orders = await Order.find({ user: user }).sort({ order_date: -1 });
    res.render("user/orderList", {
      user: userData,
      order: Orders,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
      url: "orders",
    });
  } catch (err) {
    res.send(err)
  }
};


//order -get
const loadOrder = async (req, res) => {
  try {
    const user = req.session.user_id;
    const id = req.params.id;
    const order = await Order.findById(id).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" }
    ]);
    let delivery;
    if (order.delivery_date) {
      delivery = order.delivery_date;
    } else {
      delivery = new Date(order.order_date);
      if (order.delivery == 20) {
        delivery.setDate(delivery.getDate() + 4);
      } else if (order.delivery == 10) {
        delivery.setDate(delivery.getDate() + 7);
      } else {
        delivery.setDate(delivery.getDate() + 12);
      }
    }
    res.render("user/order", {
      user: order.user,
      order: order,
      delivery: delivery,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
      url: "orders",
    });
  } catch (err) {
    res.send(err);
  }
};


//order cod
const cod = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.body.id, { $set: { order_status: "delivered", payment_status: "completed" } })
    let status = true
    res.json({ status })
  } catch (err) {
    res.send(err)
  }
}


//couponCheck
const couponCheck = async (req, res) => {
  try {
    let userId = req.session.user_id;
    let couponcode = req.body.code;
    let coupon = await Coupon.findOne({ couponCode: couponcode })
    if (coupon) {
      let start = new Date(coupon.startDate)
      let end = new Date(coupon.endDate)
      const now = new Date(Date.now());
      if (now >= start && now <= end && coupon.status) {
        if (coupon.quantity) {
          if (parseInt(req.body.spend) >= coupon.minSpend) {
            let discount = coupon.discount
            let id = coupon._id
            const ownerIndex = coupon.owner.findIndex(
              (owner) => owner.user.toString() === userId
            );
            if (ownerIndex !== -1) {
              if (coupon.owner[ownerIndex].uses < coupon.limit) {
                // coupon.owner[ownerIndex].uses += 1;
                res.json({ status: "applied", discount, id });
              } else {
                res.json({ status: "limit" });
              }
            } else {
              // coupon.owner.push({ user: userId});y
              res.json({ status: "applied", discount, id });
            }

          } else {
            res.json({ status: "minspend" })
          }
        } else {
          res.json({ status: "quantity" })
        }
      } else {
        res.json({ status: "expired" })
      }
    } else {
      res.json({ status: "invalid" })
    }

  }
  catch (error) {
    console.log(error);
    next(error);
  }
}

//order -cancel
const cancelOrder = async (req, res) => {
  try {
    const id = req.body.id
    console.log(id)
    const order = await Order.findById(id)
    console.log("original order:", order)
    // if (order.payment_method == "cod") {
      const newOrder = await Order.findByIdAndUpdate(id, { $set: { order_status: "cancelled" } },{new:true})
      for (item of newOrder.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            [`size.${item.size}`]: item.quantity,
            quantity: item.quantity
          }
        },{new:true})
      }
        console.log(newOrder)
      if (newOrder) {
        res.json({ status: true })
      } else {
        res.json({ status: false })
      }

    } catch (err) {
    res.send(err)
  }
}

const refundPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.body.id);
    if (order) {
      const paymentId = order.razorpay_order_id; // Payment ID of the order to be refunded
      const refundAmount = order.total * 100; // Refund amount in paise (Rupees * 100)

      razorpayInstance.payments.refund(paymentId, { amount: refundAmount }, async (err, refund) => {
        if (!err) {
          // Update order details with refund status
          order.payment_status = "refunded";
          await order.save();
          res.json({ status: true, msg: "Refund initiated successfully" });
        } else {
          res.json({ status: false, error: err });
        }
      });
    } else {
      res.json({ status: false, error: "Order not found" });
    }
  } catch (err) {
    res.send(err);
  }
};


module.exports = {
  loadCheckout,
  shippingAddress,
  shippingCharge,
  checkout,
  loadOrderDetails,
  loadOrder,
  cod,
  cancelOrder,
  couponCheck,
  checkoutPayment,
  placeOrder
};
