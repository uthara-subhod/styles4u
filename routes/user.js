const express=require('express')
const router=express.Router()
const userController=require('../controllers/users')

router.get('/',userController.loadHome)
router.get('/login',userController.loadlogin)
router.get('/signup',userController.loadSignup)

module.exports=router
