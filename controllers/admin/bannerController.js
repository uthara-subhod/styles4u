const Banner = require('../../models/banner')
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");


const loadBanner = async (req,res) => {
    res.render('admin/banner',{url: "category",message:null})
}

const addBanner = async (req,res) => {
    const file = req.file;
    const tempFilePath = file.path;
        const croppedFilename = "cropped_" + file.originalname;
        const croppedFilePath = path.join("images", "temp", croppedFilename);
        const publicDirectoryPath = path.join(__dirname, "..", "..", "public");
        const imageInfo = await sharp(tempFilePath).metadata();
        const imageWidth = imageInfo.width;
        const imageHeight = imageInfo.height;
        const width = 1253;
        const height = 410;
        const left = 0;
        const top = 0;

        // Verify that the extract area is within the bounds of the image
        if (left + width > imageWidth || top + height > imageHeight) {
          await sharp(tempFilePath)
            .resize({ width: width, height: height, left: 0, top: 0 })
            .toFile(path.join(publicDirectoryPath, croppedFilePath));
        } else {
          await sharp(tempFilePath)
            .extract({ width: width, height: height, left: 0, top: 0 })
            .toFile(path.join(publicDirectoryPath, croppedFilePath));
        }
        const croppedImage ="/images/temp/" + croppedFilename;

        fs.unlink(tempFilePath, function (err) {
          if (err) {
            console.log(
              "An error occurred while deleting the temporary file: " + err
            );
          }
        });
        const {title,description,url}=req.body
        const banner= await new Banner({title:title,description:description,url:url,bannerImage:croppedImage}).save()
        if(banner){
            res.render('admin/banner',{url: "banner", message:"add"})
        }else{
            res.render('admin/banner',{url: "banner", message:"exist"})
        }
        
}

module.exports= {
    loadBanner,
    addBanner
}