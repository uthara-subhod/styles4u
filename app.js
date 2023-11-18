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
    if (!req.session.user) {
      res.render("error404", { user: null, url: null,req});
    } else {
      res.render("error404", { user: req.session.user, cartCount: res.locals.count, wishCount: res.locals.wishlist, url: null,});
    }
  });
  
//server
app.listen(process.env.PORT, ()=>{
    console.log('server is running http://localhost:8000');
})



