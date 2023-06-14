const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const user = require("./routes/user");
const admin = require("./routes/admin");
require("dotenv/config");

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('user', __dirname + '/views/user');
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

//server
app.listen(process.env.PORT, ()=>{
    console.log('server is running http://localhost:8000');
})

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));
app.use(express.static("public"));
app.use('/',user)


