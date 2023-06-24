const express=require('express')
const router=express.Router()
const userController=require('../controllers/userController')
const shopController=require('../controllers/shopController')
const session=require('../middlwares/session')


router.get('/', userController.loadHome)
router.get('/login',session.isLogOut, userController.loadlogin)
router.post('/login',userController.autheticateUser)
router.get('/login/otp-login', userController.loadOtpLogin)
router.post('/login/otp-login',userController.otpLogin)
router.get('/login/otp-login/resend', session.isLogOut,userController.resendOTP)
router.get('/signup', session.isLogOut,userController.loadSignup)
router.post('/signup',userController.insertUser)
router.get('/signup/verify',session.isLogOut, userController.loadVerifyEmail)
router.get('/signup/success',session.isLogOut,userController.updateUserVerification)
router.get('/shop',shopController.loadShop)
router.get('/product',shopController.loadProduct)
router.get('/logout',userController.loadLogout)
router.get('/test',async(req,res)=>{
    res.render('auth/otp',{username:"utharas",resend:null})
})

module.exports=router
