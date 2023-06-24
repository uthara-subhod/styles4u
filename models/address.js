const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    buildingName: { 
        type: String,
        default:'',
     },
    street: { 
        type: String,
        required:true,
     },
    city: { 
        type: String,
         required:true,
    },
    state: { 
        type: String,
        required:true,
     },
    zipCode: { 
        type: Number,
        required:true
     },
    country: { 
        type: String,
        required:true,
     },
    phoneNumber: { 
        type: Number,
        required:true
    },
    user:{
        type:String,
        required:true
    },
    type:{
        type:String,
        require:true
    }
});

module.exports = mongoose.model("address", addressSchema);