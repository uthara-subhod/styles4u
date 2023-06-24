const User = require("../models/user");
const bcrypt = require("bcrypt");
const mail = require("../helpers/mail");
const crypto=require("crypto")

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (err) {
    console.log(err.message);
  }
};
const otpGenerator = () => {
  const otp = Math.floor(Math.random() * 9000) + 1000;
  return otp.toString();
};

const sendOTP = async (userdata, req, res) => {
  const otp = otpGenerator();
  const hashedOtp = await securePassword(otp);
  const user = userdata._id;
  const cookie_otp = {
    otp: hashedOtp,
    user: user,
  };
  res.cookie("otp", cookie_otp, {
    maxAge: 2 * 60 * 1000,
    httpOnly: true,
  });
  mail.otpEmail(userdata, otp);
};

const loadSignup = async (req, res) => {
  res.render("auth/signup", { message: null,url:'/signup' });
};

const loadVerifyEmail = async (req, res) => {
  const username = req.query.username;
  const user = await User.findOne({ username: username });
  if (user) {
    res.render("auth/verify");
  } else {
    res.redirect("/signup");
  }
};

const insertUser = async (req, res) => {
  const userdata = await User.findOne({ username: req.body.username });
  if (userdata) {
    res.render("auth/signup", {
      message: "User already exists",
      email: req.body.email,
    });
  } else {
    const spass = await securePassword(req.body.password);
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      passwordHash: spass,
    });
    const userData = await user.save();
    const message = await mail.verifyEmail(req.body);
    if (message === "success") {
      res.redirect(`/signup/verify?username=${req.body.username}`);
    } else {
      await User.deleteOne({ _id: userData._id });
      res.send("error man");
    }
  }
};

const updateUserVerification = async (req, res) => {
  const username = req.query.username;
  try {
    const user = await User.findOne({ username: username });
    if (user) {
      user.isVerified = true;
      await user.save();
      res.render("auth/gotologin");
    } else {
      res.redirect("/signup");
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred while verifying the user.");
  }
};
const loadlogin = async (req, res) => {
  res.render("auth/login", { message: null ,url:'/login'});
};

const autheticateUser = async (req, res) => {
  const userData = await User.findOne({ username: req.body.username });
  if (userData) {
    const passMatch = await bcrypt.compare(
      req.body.password,
      userData.passwordHash
    );
    if (passMatch) {
      if (!userData.access) {
        res.render("auth/login", { message: "Your account is blocked" });
      } else if (!userData.isVerified) {
        res.render("auth/login", { message: "Please verify your email" });
      } else {
        await sendOTP(userData, req, res);
        const username = userData.username;
        res.redirect(`/login/otp-login?username=${username}`);
      }
    }
  }
};
const loadOtpLogin = async (req, res) => {
  if (req.cookies.otp&&req.query.username) {
    res.render("auth/otp", { resend: null,username:req.query.username });
  } else {
    res.redirect("/login");
  }
};
const otpLogin = async (req, res) => {
  const otp = req.cookies.otp;
  console.log(otp.user);
  const userData = await User.findOne({ _id: otp.user });
  console.log(otp.user);
  let hotp = otp.otp;
  hotp = hotp.toString();
  let userotp = req.body.otp;
  userotp = otp.toString();
  const otpMatch = bcrypt.compare(userotp, hotp);
  if (otpMatch) {
    req.session.user = userData.username;
    req.session.isAdmin = userData.isAdmin;
    if(req.body.remember){
      req.session.cookie.maxAge=30 * 24 * 60 * 60 * 1000;
    }
    else{
      req.session.cookie.maxAge=24 * 60 * 60 * 1000;
    }
    res.redirect("/");
  } else {
    res.render("auth/otp", { resend: "Invalid" });
  }
};

const resendOTP = async (req, res) => {
  const user = await User.findOne({ username: req.query.username });
  if (!req.cookies.otp) {
    await sendOTP(user, req, res);
    res.redirect(`/login/otp-login?username=${user.username}`);
  } else {
    res.redirect(`/login/otp-login?username=${user.username}`);
  }
};

const loadHome = async (req, res) => {
  if (!req.session.user) {
    res.render("user/home", { user: null });
  } else {
    res.render("user/home", { user: req.session.user });
  }
};

const loadLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.clearCookie("user");
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const loadForgotPassword=async(req,res)=>{
  res.render('auth/forgotpass',{message:null})
}
const ForgotPassword=async(req,res)=>{
  req.body.username=username
  const user=await User.findOne({username:username})
  if(user){
    const passLink=crypto.randomBytes(18).toString('hex')
    const password = {
      hash: passLink,
      user: user._id,
    };
    res.cookie("password", password, {
      maxAge: 2 * 60 * 1000,
      httpOnly: true,
    });
    await sendMail(user,passLink)
    res.render('auth/passSend')
  }
}

const loadResetPassword=async(req,res)=>{
  res.render('auth/reset',{message:null})
}

const resetPassword=async(req,res)=>{
  
}

module.exports = {
  loadHome,
  loadlogin,
  loadSignup,
  insertUser,
  loadVerifyEmail,
  updateUserVerification,
  autheticateUser,
  loadOtpLogin,
  otpLogin,
  resendOTP,
  loadLogout,
};
