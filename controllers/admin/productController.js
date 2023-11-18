const Product = require("../../models/product");
const Category = require("../../models/category");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");


//productlist -get
const loadProducts = async (req, res) => {
  try {
    const products = await Product.find({
      deleted: { $ne: true },
    })

    res.render("admin/products", {
      items: products,
      url: "product",
    });
  } catch (err) {
    res.send(err);
  }
};


//product add/edit -get
const loadProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    let item = null;
    if (req.query.id) {
      item = await Product.findOne({product_id:req.query.id});
    }
    res.render("admin/product", {
      message: null,
      cat: categories,
      item,
      url: "product",
    });
  } catch (err) {
    res.send(err);
  }
};


//product add-post
const AddProduct = async (req, res) => {
  try {
    const cat = req.body.category.split(",");
    if (cat[0] !== cat[1]) {
      var category = await Category.findOne({ name: cat[0], sub: cat[1] });
    } else {
      var category = await Category.findOne({ name: cat[0] });
    }

    if (category) {
      const files = req.files;
      const croppedImages = [];
      for (const file of files) {
        const tempFilePath = file.path;
        const croppedFilename = "cropped_" + file.originalname;
        const croppedFilePath = path.join("images", "temp", croppedFilename);
        const publicDirectoryPath = path.join(__dirname, "..", "..", "public");
        const imageInfo = await sharp(tempFilePath).metadata();
        const imageWidth = imageInfo.width;
        const imageHeight = imageInfo.height;
        const width = 1050;
        const height = 1400;
        const left = 0;
        const top = 0;

        // Verify that the extract area is within the bounds of the image
        if (left + width > imageWidth || top + height > imageHeight) {
          await sharp(tempFilePath)
            .resize({ width: 1050, height: 1400, left: 0, top: 0 })
            .toFile(path.join(publicDirectoryPath, croppedFilePath));
        } else {
          await sharp(tempFilePath)
            .extract({ width: 1050, height: 1400, left: 0, top: 0 })
            .toFile(path.join(publicDirectoryPath, croppedFilePath));
        }
        croppedImages.push("/images/temp/" + croppedFilename);

        fs.unlink(tempFilePath, function (err) {
          if (err) {
            console.log(
              "An error occurred while deleting the temporary file: " + err
            );
          }
        });
      }

      const xs = parseInt(req.body.xs);
      const s = parseInt(req.body.s);
      const m = parseInt(req.body.m);
      const l = parseInt(req.body.l);
      const xl = parseInt(req.body.xl);
      const quantity = xs + s + m + l + xl;
      const product = await Product(
        { productName: req.body.name, 
          category: cat[0], 
          subcategory: cat[1],
            price: req.body.price,
            details: req.body.details,
            blurb: req.body.blurb,
            quantity: quantity,
            productImages: croppedImages,
            color: req.body.color,
            size: {
              xs: xs,
              s: s,
              m: m,
              l: l,
              xl: xl,
            },
            brand: req.body.brand,
          },
      ).save();

      res.redirect("/admin/product");
    } else {
      res.send("Oops");
    }
  } catch (err) {
    console.log("An error occurred while cropping the images: " + err);
    res.status(500).send("An error occurred while cropping the images");
  }
};


//product edit-post
const EditProduct = async (req, res) => {
  try {
    const product = await Product.findOne({product_id:reqbodyquery.id});
    const cat = req.body.category.split(",");
    if (cat[0] !== cat[1]) {
      var category = await Category.findOne({ name: cat[0], sub: cat[1] });
    } else {
      var category = await Category.findOne({ name: cat[0] });
    }

    if (category) {
      const files = req.files;
      if (files.length) {
        for (image of product.productImages) {
          const imgPath = path.join(__dirname, "..", "..", "public", image);
          fs.unlink(imgPath, function (err) {
            if (err) {
              console.log("An error occurred while replacing " + err);
            }
          });
          await Product.findOneAndUpdate({product_id:req.body.id} ,{
            $pull: { productImages: image },
          });
        }

        const croppedImages = [];
        for (const file of files) {
          const tempFilePath = file.path;
          const croppedFilename = "cropped_" + file.originalname;
          const croppedFilePath = path.join("images", "temp", croppedFilename);
          const publicDirectoryPath = path.join(
            __dirname,
            "..",
            "..",
            "public"
          );
          const imageInfo = await sharp(tempFilePath).metadata();
          const imageWidth = imageInfo.width;
          const imageHeight = imageInfo.height;
          const width = 1050;
          const height = 1400;
          const left = 0;
          const top = 0;

          // Verify that the extract area is within the bounds of the image
          if (left + width > imageWidth || top + height > imageHeight) {
            await sharp(tempFilePath)
              .resize({ width: 1050, height: 1400, left: 0, top: 0 })
              .toFile(path.join(publicDirectoryPath, croppedFilePath));
          } else {
            await sharp(tempFilePath)
              .extract({ width: 1050, height: 1400, left: 0, top: 0 })
              .toFile(path.join(publicDirectoryPath, croppedFilePath));
          }
          croppedImages.push("/images/temp/" + croppedFilename);

          fs.unlink(tempFilePath, function (err) {
            if (err) {
              console.log(
                "An error occurred while deleting the temporary file: " + err
              );
            }
          });
        }
        const item = await Product.findOneAndUpdate(
          { product_id:req.body.id},
          {
            $set: {
              productImages: croppedImages,
            },
          },
          { upsert: true, new: true }
        );
      }
      const xs = parseInt(req.body.xs);
      const s = parseInt(req.body.s);
      const m = parseInt(req.body.m);
      const l = parseInt(req.body.l);
      const xl = parseInt(req.body.xl);

      const quantity = xs + s + m + l + xl;

      const item = await Product.findOneAndUpdate(
        { product_id:req.body.id},
        {
          $set: {
            productName:req.body.name,
            category:cat[0],
            subcategory:cat[1]==cat[0]?"":cat[1],
            price: req.body.price,
            details: req.body.details,
            blurb: req.body.blurb,
            quantity: quantity,
            color: req.body.color,
            size: {
              xs: xs,
              s: s,
              m: m,
              l: l,
              xl: xl,
            },
            brand: req.body.brand,
          },
        },
        { upsert: true, new: true }
      );

      res.redirect("/admin/product");
    } else {
      res.send("Oops");
    }
  } catch (err) {
    console.log("An error occurred while cropping the images: " + err);
    res.status(500).send("An error occurred while cropping the images");
  }
};


//product soft delete
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate({product_id:req.body.id}, {
      $set: { deleted: true },
    });
    if (product) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (err) {
    res.send(err);
  }
};


module.exports = {
  loadProducts,
  loadProduct,
  AddProduct,
  EditProduct,
  deleteProduct,
};
