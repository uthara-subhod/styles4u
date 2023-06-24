const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/temp"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
};
const uploads = multer({
  storage: storage,
  fileFilter: fileFilter,
}).array("images",5)

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
}).single("image")



const Uploads=(req,res,next)=>{
  uploads(req,res,(err)=>{
  if(err){
  res.send("NO")
  }
  else{
   next()
  }
})
}
const Upload=(req,res,next)=>{
  upload(req,res,(err)=>{
  if(err){
  res.send("NO")
  }
  else{
   next()
  }
})
}
module.exports = {
  Uploads,
  Upload
};
