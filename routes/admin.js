const express=require('express')
const router=express.Router()
const product=require('../controllers/admin/productController')
const user=require('../controllers/admin/userController')
const category=require('../controllers/admin/categoryController')
const order=require('../controllers/admin/orderController')
const coupon=require('../controllers/admin/couponController')
const multer=require('../middlwares/multer')
const session=require('../middlwares/session')

router.use(session.admin)


//user management
router.get('/customer',user.loadCustomers)

router.get('/customer/block',user.block)


//category management
router.get('/category', category.loadCategory)

router.get('/category/main/add',category.loadAddCategory)
router.post('/category/main/add',category.addCategory)

router.get('/category/main/edit',category.loadEditCategory)
router.post('/category/main/edit',category.editCategory)

router.get('/category/sub/add',category.loadAddSub)
router.post('/category/sub/add',category.addSub)

router.get('/category/sub/edit',category.loadEditSub)
router.post('/category/sub/edit',category.editSub)

router.get('/category/delete',category.deleteCategory)


//product management
router.get('/product', product.loadProducts)

router.get('/product/add',product.loadProduct)
router.post('/product/add',multer.Uploads, product.AddProduct)

router.get('/product/edit',product.loadProduct)
router.post('/product/edit',multer.Uploads,product.EditProduct)

router.post('/product/delete', product.deleteProduct)


//order management
router.get('/order',order.loadOrders)

router.get('/order/:id',order.loadOrder)

router.post('/order/status',order.statusChange)


//coupon management
router.get('/coupon', coupon.loadCoupons)

router.get('/coupon/add',coupon.loadCoupon)
router.post('/coupon/add', coupon.addCoupon)

module.exports=router