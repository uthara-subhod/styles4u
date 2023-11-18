const Banner = require('../../models/banner')
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");


//bannerAdd -load
const loadBanner = async (req,res) => {
  try{
    res.render('admin/banner',{url: "banner",message:null})
  }catch(err){
    res.send(err)
  }
}

//bannerAdd -post
const addBanner = async (req, res) => {
  try{
    const file = req.file;
    const tempFilePath = file.path;
    const croppedFilename = "cropped_" + file.originalname;
    const croppedFilePath = path.join("images", "temp", croppedFilename);
    const publicDirectoryPath = path.join(__dirname, "..", "..", "public");
    const imageInfo = await sharp(tempFilePath).metadata();
    const imageWidth = imageInfo.width;
    const imageHeight = imageInfo.height;
    const aspectRatio = 16 / 9;
  
    let width = imageWidth;
    let height = Math.floor(imageWidth / aspectRatio);
    let left = 0;
    let top = 0;
  
    // If the calculated height exceeds the actual height, adjust the height and top position
    if (height > imageHeight) {
      height = imageHeight;
      width = Math.floor(imageHeight * aspectRatio);
      left = Math.floor((imageWidth - width) / 2);
      top = 0;
    }
  
    await sharp(tempFilePath)
      .extract({ width: width, height: height, left: left, top: top })
      .toFile(path.join(publicDirectoryPath, croppedFilePath));
  
    const croppedImage = "/images/temp/" + croppedFilename;
  
    fs.unlink(tempFilePath, function (err) {
      if (err) {
        console.log("An error occurred while deleting the temporary file: " + err);
      }
    });
  
    const { title, description, url } = req.body;
    const banner = await new Banner({
      title: title,
      description: description,
      url: url,
      bannerImage: croppedImage,
    }).save();
  
    if (banner) {
      res.render("admin/banner", { url: "banner", message: "add" });
    } else {
      res.render("admin/banner", { url: "banner", message: "exist" });
    }
  }catch(err){
    res.send(err)
  }
}
  
//banner list -get
const loadBanners = async (req,res) => {
  try{
    const banner= await Banner.find()
    res.render('admin/banners',{url:"banner" ,banner})
  }catch(err){
    res.send(err)
  }
}  
  

//view banner -get
const viewBanner = async (req,res) =>{
  try{
    const banner = await Banner.findById(req.query.id)
    res.render('admin/viewBanner',{url: "banner",message:null,banner})
  } catch(err){
    res.send(err)
  }
}

const editBanner = async (req,res) =>{
  try{
  const { title, description, url } = req.body;
  const file = req.file;
  let banner
  if(file){
  const tempFilePath = file.path;
  const croppedFilename = "cropped_" + file.originalname;
  const croppedFilePath = path.join("images", "temp", croppedFilename);
  const publicDirectoryPath = path.join(__dirname, "..", "..", "public");
  const imageInfo = await sharp(tempFilePath).metadata();
  const imageWidth = imageInfo.width;
  const imageHeight = imageInfo.height;
  const aspectRatio = 16 / 9;

  let width = imageWidth;
  let height = Math.floor(imageWidth / aspectRatio);
  let left = 0;
  let top = 0;

  // If the calculated height exceeds the actual height, adjust the height and top position
  if (height > imageHeight) {
    height = imageHeight;
    width = Math.floor(imageHeight * aspectRatio);
    left = Math.floor((imageWidth - width) / 2);
    top = 0;
  }

  await sharp(tempFilePath)
    .extract({ width: width, height: height, left: left, top: top })
    .toFile(path.join(publicDirectoryPath, croppedFilePath));

  const croppedImage = "/images/temp/" + croppedFilename;

  fs.unlink(tempFilePath, function (err) {
    if (err) {
      console.log("An error occurred while deleting the temporary file: " + err);
    }
  });

  banner = await Banner.findByIdAndUpdate(req.query.id,{
    title: title,
    description: description,
    url: url,
    bannerImage: croppedImage,
  })

}else{
  banner = await Banner.findByIdAndUpdate(req.query.id,{
    title: title,
    description: description,
    url: url,
  })
}
  if (banner) {
    res.render("admin/viewBanner", { url: "banner", banner, message: "edit" });
  } else {
    res.render("admin/viewBanner", { url: "banner", banner, message: "error" });
  }
}catch(err){
  res.send(err)
}
}


module.exports= {
    loadBanner,
    addBanner,
    loadBanners,
    viewBanner,
    editBanner
}