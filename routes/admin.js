const express=require('express')
const router=express.Router()
const adminController=require('../controllers/adminController')
const multer=require('../middlwares/multer')
const session=require('../middlwares/session')

// router.use(session.admin)

router.get('/customer',adminController.loadCustomers)
router.get('/categories', adminController.loadCategory)
router.get('/add-category',adminController.loadAddCategory)
router.post('/add-category',adminController.addCategory)
router.get('/products', adminController.loadProducts)
router.get('/edit-user',adminController.loadEditCustomer)
router.post('/edit-user',adminController.editCustomer)
router.get('/add-product',adminController.loadAddProduct)
router.post('/add-product',multer.Uploads, adminController.AddProduct)
module.exports=router