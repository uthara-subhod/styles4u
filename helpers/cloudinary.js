
const cloudinary=require('cloudinary')

  const cloudUploads=function (file){
    return new Promise(resolve=>{
      cloudinary.v2.uploader.upload(file,(result)=>{
        resolve({
          url:result.url,
          id:result.public_id
        },)
      })
    })
  }
  
  module.exports={
    cloudUploads
  }