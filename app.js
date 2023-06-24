const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const user = require("./routes/user");
const admin = require("./routes/admin");
const cloudinary=require('cloudinary').v2
const cookieParser = require("cookie-parser");
const session=require("express-session");
const nocache=require('nocache');
require("dotenv/config");

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('auth', __dirname + '/views/auth');
app.set('admin', __dirname + '/views/admin')
mongoose.set("strictQuery", false)

//database
mongoose.connect(process.env.DATABASE_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
    console.log('Mongodb Connected')
}).catch(()=>{
    console.log(err)
})

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_KEY,
    api_secret:process.env.CLOUD_SECRET
})

//server

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: { sameSite:"strict"},
    resave: false,
    saveUninitialized: true
  }));

// app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cookieParser())
app.use(nocache())
app.use('/',user)
app.use('/admin',admin)

app.listen(process.env.PORT, ()=>{
    console.log('server is running http://localhost:8000');
})



