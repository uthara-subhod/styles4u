const Cart = require("../../models/cart");
const Category = require("../../models/category");
const Address = require("../../models/address");
const Order = require("../../models/order");
const User = require("../../models/user");
const Product = require("../../models/product");
const Coupon = require("../../models/coupon");
const Razorpay = require("razorpay");
const Review = require("../../models/review");
const Wallet = require("../../models/wallet");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");

const razorpayInstance = new Razorpay({
  key_id: "rzp_test_lBhHdo9vOqWbPn",
  key_secret: "Y8eVWHfxOhAD2X6lau3YXtBj",
});

//checkout-get
const loadCheckout = async (req, res) => {
  try {
    const categories = await Category.find();
    const user = req.session.user_id;
    const cartItems = await Cart.findOne({ owner: user }).populate({
      path: "items.productId",
    });
    if(cartItems){
      const userwallet = await User.findById(user);
    let wallet = 0;
    if (userwallet.wallet) {
      wallet = await Wallet.findById(userwallet.wallet);
    }

    const addresses = await Address.find({ user: user, type: { $ne: "temp" } });
    res.render("user/checkout", {
      cat: categories,
      url: null,
      cartItems,
      addresses,
      wallet,
      user: req.session.user,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
    });
    }else{
      if (!req.session.user) {
        res.render("error404", { user: null, url: null, req:null});
      } else {
        res.render("error404", { user: req.session.user, url: null, req:null});
      }
    }
    
  } catch (err) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
};

//checkout-add address
const shippingAddress = async (req, res) => {
  try {
    const user = req.session.user_id;
    const username = req.session.user;
    const info = req.body.info;
    let type="temp"
    if(info.saveAdd){
      type="secondary"
    }
    const address = new Address({
      user: user,
      type: type,
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

const editAddress = async (req,res) =>{
  try{
    const user = req.session.user_id;
    const info= req.body.info
    const editAddress = await Address.findByIdAndUpdate(info.addressId,{
      $set:{
        user: user,
        type: info.type,
        buildingName:info.building,
        street:info.street,
        state:info.state,
        city:info.city,
        zipCode:info.zip,
        phoneNumber:info.phone,
        country:info.country,
      }
    },{new:true})
    if(editAddress){
      res.json({status:true,info:editAddress})
    }else{
      res.json({status:false,info:null})
    }
  }catch(err){
    res.send(err)
  }
}

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
          coupon: req.body.couponId,
        }).save();
        const coupon = await Coupon.findById(order.coupon);

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
        let total = order.total;
        if (order.payment_method == "wallet") {
          let wallet = await Wallet.findOne({ user: userId });
          let balance = wallet.balance;
          let newBalance = balance - totalPrice;
          let history = {
            type: "subtract",
            amount: totalPrice,
            newBalance: newBalance,
          };
          wallet.balance = newBalance;
          wallet.history.push(history);
          await wallet.save();
          order.payment_status = "completed";
          await order.save();
        }
        await Cart.findOneAndDelete({ owner: userId });

        for (item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              [`size.${item.size}`]: -item.quantity,
              quantity: -item.quantity,
            },
          });
        }
        await User.findByIdAndUpdate(userId,{$inc:{totalOrders:1}})

        res.render("user/checkoutSuccess", {
          cat: categories,
          url: null,
          user: req.session.user,
          cartCount: 0,
          wishCount: res.locals.wishlist,
          order,
        });
      } else {
        if (!req.session.user) {
          res.render("error404", { user: null, url: null, req:null});
        } else {
          res.render("error404", { user: req.session.user, url: null, req:null});
        }
      }
    }
  } catch (error) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
};

//wallet create razorpay capture
const addWallet = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const total = parseInt(req.body.total);
    const { nanoid } = await import("nanoid");
    const receipt = nanoid();
    const options = {
      amount: total * 100, // Amount in paise (Rupees * 100)
      currency: "INR",
      receipt: receipt, // Unique order receipt ID
      payment_capture: 1, // Automatically capture the payment
    };
    razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
      if (!err) {
        res.json({
          status: true,
          wallet_amount: total,
          order_id: razorpayOrder.id,
          key_id: "rzp_test_lBhHdo9vOqWbPn",
          msg: "Payment initiated",
        });
      } else {
        res.json({ status: false });
      }
    });
  } catch (err) {
    res.send(err);
  }
};

//add cash to wallet
const addToWallet = async (req, res) => {
  try {
    const amt = parseInt(req.body.total);
    const userId = req.session.user_id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await new Wallet({
        user: userId,
        balance: amt,
        history: [{ type: "add", amount: amt, newBalance: amt }],
      }).save();
      await User.findByIdAndUpdate(userId, { $set: { wallet: wallet._id } });
    } else {
      let balance = wallet.balance;
      let newBalance = balance + amt;
      let history = {
        type: "add",
        amount: amt,
        newBalance: newBalance,
      };
      wallet.balance = newBalance;
      wallet.history.push(history);
      await wallet.save();
    }
  } catch (err) {
    res.send(err);
  }
};

// online payment razorpay-checkout post
const checkoutPayment = async (req, res) => {
  try {
    const order = req.body.info
    if (order) {
      const options = {
        amount: order.total * 100, // Amount in paise (Rupees * 100)
        currency: "INR",
        receipt: order._id, // Unique order receipt ID
        payment_capture: 1, // Automatically capture the payment
      };

      razorpayInstance.orders.create(options, async (err, razorpayOrder) => {
        if (!err) {
          res.json({
            status: true,
            id: order.order_id,
            order_id: razorpayOrder.id,
            amount: order.total,
            key_id: "rzp_test_lBhHdo9vOqWbPn",
            msg: "Order Created",
          });
        } else {
          res.json({ status: false });
        }
      });
    }
  } catch (err) {
    res.send(err);
  }
};

const placeOrder = async (req, res) => {
    try {
      const categories = await Category.find();
      let userId = req.session.user_id;
      let cartcount = res.locals.count;
      let findCart = await Cart.findOne({ owner: userId });
      let cartItem = findCart.items;
      if (cartItem == 0) {
        res.redirect("/cart");
      } else {
        let address_id,payment,totalPrice,delivery,couponid,paymentId
        if(req.body.info){
          const info=req.body.info
          address_id = info.orderAddress;
        payment = info.paymentMode;
        totalPrice = parseInt(info.total);
        delivery = parseInt(info.shippingMethod);
        paymentId=req.body.paymentId
        if(info.couponId){
          couponid=info.couponId
        }
        }
        if (couponid) {
          var order = await new Order({
            user: userId,
            address: address_id,
            items: cartItem,
            total: totalPrice,
            delivery: delivery,
            payment_method: payment,
            payment_status: "completed",
            order_status: "pending",
            coupon: couponid,
            razorpay_payment_id:paymentId
          }).save();
          const coupon = await Coupon.findById(order.coupon);
  
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
            payment_status: "completed",
            order_status: "pending",
            razorpay_payment_id:paymentId
          }).save();
        }
        if (order) {
          await Cart.findOneAndDelete({ owner: userId });
  
          for (item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: {
                [`size.${item.size}`]: -item.quantity,
                quantity: -item.quantity,
              },
            });
          }
          await User.findByIdAndUpdate(userId,{$inc:{totalOrders:1}})
  
         res.json({status:true})
        } else {
          res.json({status:false})
        }
      }
    } catch (error) {
      res.json({status:false})
    }
};

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
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
};

//order -get
const loadOrder = async (req, res) => {
  try {
    const user = req.session.user_id;
    const id = req.params.id;
    const order = await Order.findOne({ order_id: id }).populate([
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
    let order1=await Order.findOne({ order_id: id }).populate([
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
      order: order2,
      return1:return2,
      delivery: delivery,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
      url: "orders",
    });
    }else{
      if (!req.session.user) {
        res.render("error404", { user: null, url: null, req:null});
      } else {
        res.render("error404", { user: req.session.user, url: null, req:null});
      }
    }
    
  } catch (err) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
};

//order cod
const cod = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { order_id: req.body.id },
      {
        $set: { order_status: "delivered", payment_status: "completed" },
      }
    );
    let status = true;
    res.json({ status });
  } catch (err) {
    res.send(err);
  }
};

//couponCheck
const couponCheck = async (req, res) => {
  try {
    let userId = req.session.user_id;
    let couponcode = req.body.code;
    let coupon = await Coupon.findOne({ couponCode: couponcode });
    if (coupon) {
      let start = new Date(coupon.startDate);
      let end = new Date(coupon.endDate);
      const now = new Date(Date.now());
      if (now >= start && now <= end && coupon.status) {
        if (coupon.quantity) {
          if (parseInt(req.body.spend) >= coupon.minSpend) {
            let discount = coupon.discount;
            let id = coupon._id;
            let max = null;
            if (coupon.maxAmount) {
              max = coupon.maxAmount;
            }
            const ownerIndex = coupon.owner.findIndex(
              (owner) => owner.user.toString() === userId
            );
            if (ownerIndex !== -1) {
              if (coupon.owner[ownerIndex].uses < coupon.limit) {
                // coupon.owner[ownerIndex].uses += 1;
                res.json({ status: "applied", discount, id, max });
              } else {
                res.json({ status: "limit" });
              }
            } else {
              // coupon.owner.push({ user: userId});y
              res.json({ status: "applied", discount, id, max });
            }
          } else {
            res.json({ status: "minspend" });
          }
        } else {
          res.json({ status: "quantity" });
        }
      } else {
        res.json({ status: "expired" });
      }
    } else {
      res.json({ status: "invalid" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//order -cancel
const cancelOrder = async (req, res) => {
  try {
    const id = req.body.id;
    const userId = req.session.user_id;
    const order = await Order.findOne({ order_id: id });
    // if (order.payment_method == "cod") {
    const newOrder = await Order.findOneAndUpdate(
      { order_id: id },
      { $set: { order_status: "cancelled" } },
      { new: true }
    );
    for (item of newOrder.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            [`size.${item.size}`]: item.quantity,
            quantity: item.quantity,
          },
        },
        { new: true }
      );
    }

    if (newOrder) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (err) {
    res.send(err);
  }
};

//refund -get
const loadRefund = async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.id });
    if (order) {
      if (
        order.order_status == "cancelled" &&
        order.payment_method == "online" &&
        order.payment_status != "refunded"
      ) {
        const categories = Category.find();
        const orderId = req.params.id;
        res.render("user/refund", {
          cat: categories,
          url: null,
          user: req.session.user,
          cartCount: res.locals.count,
          wishCount: res.locals.wishlist,
          orderId,
        });
      } else {
        const user = req.session.user;
        res.redirect(`/user/orders`);
      }
    } else {
      if (!req.session.user) {
        res.render("error404", { user: null, url: null, req:null});
      } else {
        res.render("error404", { user: req.session.user, url: null, req:null});
      }
    }
  } catch (err) {
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
};

const walletRefund = async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.body.id });
    const userId = req.session.user_id;
    let amt = order.total;
    let wallet = await Wallet.findOne({ user: userId });
    let balance = wallet.balance;
    let newBalance = balance + amt;
    let history = {
      type: "add",
      amount: amt,
      newBalance: newBalance,
    };
    wallet.balance = newBalance;
    wallet.history.push(history);
    await wallet.save();
    order.payment_status = "refunded";
    await order.save();
    res.json({ status: true });
  } catch (err) {
    res.json({ status: false });
  }
};

//refund-post
const refundPayment = async (req, res) => {
  try {
    const order = await Order.findOne({order_id:req.params.id});
    const info = req.body.info;
    if (order) {
      if (info.method == "razorpay") {
        const paymentId = order.razorpay_payment_id; // Payment ID of the order to be refunded
        const refundAmount = order.total * 100; // Refund amount in paise (Rupees * 100)

        razorpayInstance.payments.refund(
          paymentId,
          { amount: refundAmount },
          async (err, refund) => {
            if (!err) {
              order.payment_status = "refunded";
              order.order_status = "cancelled";
              await order.save();
              res.json({ status: true, msg: "Refund initiated successfully" });
            } else {
              res.json({ status: false, msg: err });
            }
          }
        );
      } else {
        const userId = req.session.user_id;
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
        order.order_status = "cancelled";
        await order.save();
        if (wallet) {
          res.json({ status: true, msg: "Refund initiated successfully" });
        } else {
          res.json({ status: false, msg: "oops" });
        }
      }
    } else {
      res.json({ status: false, msg: "Order not found" });
    }
  } catch (err) {
    res.send(err);
  }
};

const loadAddReviews = async (req, res) => {
  try{
    const user = req.session.user_id;
    const id = req.params.id;
    const order = await Order.findOne({ order_id: id }).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" },
    ]);
    let reviews = [];
    if(order){
      if(order.order_status=="delivered"){
        for (var i = 0; i < order.items.length; i++) {
          const productId = order.items[i].productId._id;
          const review = await Review.findOne({ user: user, product: productId });
          if (review) {
            reviews[i] = review;
          }
        }
        res.render("user/review", {
          user: order.user,
          order: order,
          reviews,
          cartCount: res.locals.count,
          wishCount: res.locals.wishlist,
          url: "orders",
        });
      }else{
        res.redirect(`/user/orders/${order.order_id}`)
      }
    }else{
      if (!req.session.user) {
        res.render("error404", { user: null, url: null, req:null});
      } else {
        res.render("error404", { user: req.session.user, url: null, req:null});
      }
    }
  }catch(err){
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
};

const addReview = async (req, res) => {
  try {
    const rating = parseInt(req.body.info.rating);
    const review = req.body.info.review;
    const user = req.session.user_id;
    let addNew;
    const productId = req.body.info.product;
    const findReview = await Review.findOne({ user: user, product: productId });

    if (!findReview) {
      addNew = await new Review({
        review: review,
        rating: rating,
        user: user,
        product: productId,
      }).save();
    } else {
      addNew = await Review.findOneAndUpdate(
        { user: user, product: productId },
        { $set: { review: review, rating: rating } },
        { new: true }
      );
    }
    if (addNew) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (err) {
    res.json(err);
  }
};

const deleteReview = async (req, res) => {
  try {
    const product = req.params.productId;
    const user = req.session.user_id;
    const findReview = await Review.findOneAndDelete({
      user: user,
      product: product,
    });
    if (findReview) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (err) {
    res.json({ error: err });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ order_id: orderId }).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" },
    ]);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Read the invoice template file
    const invoiceTemplatePath = path.join(
      __dirname,
      "..",
      "..",
      "views/user/invoiceOrder.ejs"
    );
    fs.readFile(invoiceTemplatePath, "utf8", async (err, data) => {
      if (err) {
        // Handle errors
        return res.status(500).send("Error reading invoice template file.");
      }

      // Render the invoice template with dynamic data
      const invoiceHtml = ejs.render(data, { order });

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(invoiceHtml);
      const pdfBuffer = await page.pdf();
      await browser.close();

      // Set response headers to force download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${orderId}.pdf"`
      );

      res.send(pdfBuffer);
    });
  } catch (err) {
    return res.status(404).json({ message: "Order not found" });
  }
};

const loadReturnOrder = async (req,res) =>{
  try{
    const user = req.session.user_id;
    const id = req.params.id;
    
    const order = await Order.findOne({ order_id: id }).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" },
    ]);
    if(order){
      const currentDate = new Date();
      const deliveryDate = new Date(order.delivery_date);
      const daysSinceDelivery = (currentDate - deliveryDate) / (1000 * 60 * 60 * 24); 

      if (daysSinceDelivery <= 7  && order.order_status === "delivered") { 
        let return1=order
        for(let i=0;i<order.items.length;i++){
          if(order.items[i].returned){
            let quantity=order.items[i].quantity-order.items[i].returned
            return1.items[i].quantity=quantity
          }
        }
        res.render("user/returnOrder", {
          user: order.user,
          return1: return1,
          cartCount: res.locals.count,
          wishCount: res.locals.wishlist,
          url: "orders",
        });
      }else{
        res.redirect(`/user/orders/${order.order_id}`)
      }
    }else{
      if (!req.session.user) {
        res.render("error404", { user: null, url: null, req:null});
      } else {
        res.render("error404", { user: req.session.user, url: null, req:null});
      }
    }
  }catch(err){
    if (!req.session.user) {
      res.render("error404", { user: null, url: null, req:null});
    } else {
      res.render("error404", { user: req.session.user, url: null, req:null});
    }
  }
}

const returnOrder = async (req,res) =>{
  try{
    const refund= parseInt(req.body.info.refund);
    const id=req.params.id
    const user=req.session.user_id
    const refundMode=req.body.info.refundMode
    const order = await Order.findOne({ order_id: id }).populate([
      { path: "address" },
      { path: "user" },
      { path: "items.productId" },
    ]);
    if(refundMode=='wallet'){
      var wallet = await Wallet.findOne({user:user})
    if(wallet){
      let balance = wallet.balance;
      let newBalance = balance + refund;
      let history = {
        type: "add",
        amount: refund,
        newBalance: newBalance,
      };
      wallet.balance = newBalance;
      wallet.history.push(history);
      await wallet.save();
    }else{
      wallet=new Wallet({
        user:user,
        balance:refund,
        history:[{type:"add",amount:refund,newBalance:refund}]
      })
    }
    if(wallet){
      for (let i = 0; i < order.items.length; i++) {
        const productId = order.items[i].productId._id;
        const size = order.items[i].size;
        if (req.body.info[`returned${productId}${size}`]) {
          const returnedQuantity = parseInt(req.body.info[`returned${productId}${size}`]);
          order.items[i].returned = returnedQuantity;
          await order.save()
        }
      }
      res.json({status:true})
    }else{
      res.json({status:false})
    }
    }else{
      const paymentId = order.razorpay_payment_id; // Payment ID of the order to be refunded
      const refundAmount = refund * 100; // Refund amount in paise (Rupees * 100)
      
      razorpayInstance.payments.refund(
        paymentId,
        { amount: refundAmount },
        async (err, refund) => {
          if (!err) {
            for (let i = 0; i < order.items.length; i++) {
              const productId = order.items[i].productId._id;
              const size = order.items[i].size;
              if (req.body.info[`returned${productId}${size}`]) {
                const returnedQuantity = parseInt(req.body.info[`returned${productId}${size}`]);
                order.items[i].quantity -= returnedQuantity;
                await order.save()
              }
            }
            res.json({status:true})
          } else {
            res.json({status:false})
          }
        }
      );
    } 
    
  }catch(err){
    res.send(err)
  }
}


module.exports = {
  loadCheckout,
  shippingAddress,
  shippingCharge,
  checkout,
  addWallet,
  addToWallet,
  loadOrderDetails,
  loadOrder,
  cod,
  cancelOrder,
  couponCheck,
  checkoutPayment,
  placeOrder,
  loadRefund,
  refundPayment,
  loadAddReviews,
  addReview,
  downloadInvoice,
  walletRefund,
  deleteReview,
  editAddress,
  loadAddReviews,
  loadReturnOrder,
  returnOrder
};
