const express=require('express')
const router=express.Router()
const userController=require('../controllers/user/userController')
const productController=require('../controllers/user/productController')
const cartController=require('../controllers/user/cartController')
const addressController=require("../controllers/user/addressController")
const wishlistController=require("../controllers/user/wishlistController")
const orderController=require("../controllers/user/orderController")
const session=require('../middlwares/session')


//home & shop
router.get('/', productController.loadHome)

router.get('/shop',productController.loadShop)

router.get('/product',productController.loadProduct)


//cart
router.get("/cart", session.isLogin, cartController.loadCart);

router.post("/cart/add", session.isLogin, cartController.addToCart);

router.post("/cart/quantity", session.isLogin, cartController.quantityChange);

router.delete("/cart/delete", session.isLogin, cartController.deleteCart);


//wishlist
router.get("/wishlist",session.isLogin,wishlistController.loadWishlist);

router.post("/wishlist/add",session.isLogin,wishlistController.addToWishlist)

router.delete("/wishlist/delete",session.isLogin,wishlistController.deleteWishlist)


//profile
router.get('/user/:username',session.isLogin, userController.loadProfile)

router.get('/user/:username/editProfile',session.isLogin,userController.loadEditProfile)
router.post('/user/:username/editProfile',userController.EditProfile)

router.get('/user/:username/changePassword',session.isLogin,userController.loadChangePassword)
router.post('/user/:username/changePassword',userController.changePasssword)

//profile -address
router.get('/user/:username/address',session.isLogin,addressController.loadAddress)

router.get('/user/:username/address/add',session.isLogin,addressController.loadAddAddress)
router.post('/user/:username/address/add',addressController.addAddress)

router.get('/user/:username/address/edit',session.isLogin,addressController.loadAddAddress)
router.post('/user/:username/address/edit',addressController.addAddress)

router.delete('/user/:username/address/delete',addressController.deleteAddress)

//profile -orders
router.get('/user/:username/orders',session.isLogin,orderController.loadOrderDetails)

router.get('/user/:username/orders/:id',session.isLogin,orderController.loadOrder)

router.post('/user/order/cod',orderController.cod)

router.post('/user/order/cancel',orderController.cancelOrder)


//checkout
router.get('/checkout',session.isLogin, orderController.loadCheckout)
router.post('/checkout',session.isLogin,orderController.checkout)

router.post('/checkout/shippingCharge',orderController.shippingCharge)

router.post('/checkout/address',orderController.shippingAddress)

router.post('/checkout/couponCheck',orderController.couponCheck)

router.post('/checkout/pay', orderController.checkoutPayment)

router.post('/checkout/placeOrder',orderController.placeOrder)


//login
router.get('/login',session.isLogOut, userController.loadlogin)
router.post('/login',userController.autheticateUser)

router.get('/logout',userController.loadLogout)


//forgotpassword
router.get('/forgotPassword', userController.loadForgotPassword)
router.post('/forgotPassword',userController.ForgotPassword)

router.get('/forgotPassword/:passlink',userController.loadResetPassword)
router.post('/forgotPassword/:passlink',userController.resetPassword)


//signup
router.get('/signup', session.isLogOut,userController.loadSignup)
router.post('/signup',userController.insertUser)

router.get('/signup/otp', session.isLogOut, userController.loadOtp)
router.post('/signup/otp',userController.otp)

router.get('/signup/otp/resend', session.isLogOut,userController.resendOTP)


module.exports=router
