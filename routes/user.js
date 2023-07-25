const express=require('express')
const router=express.Router()
const userController=require('../controllers/user/userController')
const productController=require('../controllers/user/productController')
const cartController=require('../controllers/user/cartController')
const addressController=require("../controllers/user/addressController")
const wishlistController=require("../controllers/user/wishlistController")
const orderController=require("../controllers/user/orderController")
const walletController=require('../controllers/user/walletController')
const session=require('../middlwares/session')



//home & shop
router.get('/', productController.loadHome)

router.get('/shop',productController.loadShop)

router.get('/product',productController.loadProduct)

router.post('/user/rate/:productId',orderController.addReview)

router.post('/user/rate/:productId/delete',orderController.deleteReview)


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
router.get('/user',session.isLogin, userController.loadProfile)

router.get('/user/editProfile',session.isLogin,userController.loadEditProfile)
router.post('/user/editProfile',userController.EditProfile)

router.get('/user/changePassword',session.isLogin,userController.loadChangePassword)
router.post('/user/changePassword',userController.changePasssword)


//profile -address
router.get('/user/address',session.isLogin,addressController.loadAddress)

router.get('/user/address/add',session.isLogin,addressController.loadAddAddress)
router.post('/user/address/add',addressController.addAddress)

router.get('/user/address/edit',session.isLogin,addressController.loadAddAddress)
router.post('/user/address/edit',addressController.addAddress)

router.delete('/user/address/delete',addressController.deleteAddress)


//profile -orders
router.get('/user/orders',session.isLogin,orderController.loadOrderDetails)

router.get('/user/orders/:id',session.isLogin,orderController.loadOrder)

router.get('/user/orders/:id/invoice',session.isLogin,orderController.downloadInvoice)

router.get('/user/orders/:id/rate',session.isLogin,orderController.loadAddReviews)
router.post('/user/orders/:id/rate/:productId',orderController.addReview)

router.post('/user/orders/:id/rate/:productId/delete',orderController.deleteReview)

router.get('/user/orders/:id/return',session.isLogin,orderController.loadReturnOrder)

router.post('/user/orders/:id/return/refund',orderController.returnOrder)

router.post('/user/order/cod',orderController.cod)

router.post('/user/order/cancel',orderController.cancelOrder)

router.post('/user/orders/walletRefund', orderController.walletRefund)

router.get('/user/orders/:id/refund', orderController.loadRefund)
router.post('/user/orders/:id/refund', orderController.refundPayment)


//profile- wallet
router.get('/user/wallet',session.isLogin,walletController.loadWallet)
router.post('/user/wallet/addWallet',orderController.addWallet)
router.post('/user/wallet/addToWallet',orderController.addToWallet)



//checkout
router.get('/checkout',session.isLogin, orderController.loadCheckout)
router.post('/checkout',session.isLogin,orderController.checkout)

router.post('/checkout/shippingCharge',orderController.shippingCharge)

router.post('/checkout/address',orderController.shippingAddress)

router.post('/checkout/editAddress',orderController.editAddress)

router.post('/checkout/couponCheck',orderController.couponCheck)

router.post('/checkout/pay', orderController.checkoutPayment)

router.post('/checkout/placeOrder',orderController.placeOrder)

router.post('/checkout/addWallet', orderController.addWallet)

router.post('/checkout/addToWallet', orderController.addToWallet)

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
