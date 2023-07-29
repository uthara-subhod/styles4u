const express = require("express");
const app = express();
const mongoose = require("mongoose");
const user = require("./routes/user");
const admin = require("./routes/admin");
const cookieParser = require("cookie-parser");
const session=require("express-session");
const nocache=require('nocache');
const count=require('./middlwares/count')
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



//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: { sameSite:"strict"},
    resave: false,
    saveUninitialized: true
  }));

 
app.use(express.static("public"));
app.use(cookieParser())
app.use(nocache())
app.use(count.countCart)
app.use(count.wishlistCount)
app.use('/',user)
app.use('/admin',admin)

app.use((req, res, next) => {
    const error = new Error('Page Not Found');
    error.status = 404;
    next(error);
  });
  
  app.use((err, req, res, next) => {
    let user=null
    if(req.session.user){
        user=req.session.user
    }
    res.status(err.status || 500);
    res.render('error404', { url:null,req, user});
  });
  
//server
app.listen(process.env.PORT, ()=>{
    console.log('server is running http://localhost:8000');
})



