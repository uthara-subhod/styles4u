const User = require("../../models/user");
const bcrypt = require("bcrypt");
const mail = require("../../helpers/mail");
const crypto = require("crypto");


//hash password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (err) {
    console.log(err.message);
  }
};


//generate otp
const otpGenerator = () => {
  const otp = Math.floor(Math.random() * 9000) + 1000;
  return otp.toString();
};


//otp mail+ otp cookie
const sendOTP = async (userdata, req, res) => {
  try {
    const otp = otpGenerator();
    const hashedOtp = await securePassword(otp);
    const user = userdata.username;
    const cookie_otp = {
      otp: hashedOtp,
      user: user,
    };
    res.cookie("otp", cookie_otp, {
      maxAge: 2 * 60 * 1000,
      httpOnly: true,
    });
    mail.otpEmail(userdata, otp);
  } catch (err) {
    console.log(err);
  }
};


//signup-get
const loadSignup = async (req, res) => {
  try {
    res.render("auth/signup", { message: null, url: "/signup" });
  } catch (err) {
    console.log(err);
  }
};


//signup-post
const insertUser = async (req, res) => {
  try {
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
      await sendOTP(userData, req, res);
      res.redirect(`/signup/otp?username=${req.body.username}`);
    }
  } catch (error) {
    res.send(error);
  }
};


//otp-get
const loadOtp = async (req, res) => {
  try {
    if (req.cookies.otp && req.query.username) {
      res.render("auth/otp", { resend: null, username: req.query.username });
    } else {
      res.redirect("/signup");
    }
  } catch (err) {
    console.log(err);
  }
};


//otp-post
const otp = async (req, res) => {
  try {
    if(req.cookies.otp){
    const otp = req.cookies.otp;
    let hotp = otp.otp;
    let userotp = req.body.otp;
    const otpMatch = await bcrypt.compare(userotp, hotp);
    if (otpMatch) {
      await User.findOneAndUpdate({ username: otp.user }, { $set: { isVerified: true } });
      res.render("auth/gotologin");
    } else {
      res.render("auth/otp", {
        resend: "Invalid otp",
        username: req.cookies.otp.user,
      });
    }
    }else{
      res.render("auth/otp", {
        resend: "Otp expired!",
        username: req.query.username
      });
    }
    
  } catch (error) {
    res.send(error);
  }
};


//otp-resend -get
const resendOTP = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.query.username });
    if (!req.cookies.otp) {
      await sendOTP(user, req, res);
      res.redirect(`/signup/otp?username=${user.username}`);
    } else {
      res.redirect(`/signup/otp?username=${user.username}`);
    }
  } catch (error) {
    res.send(error);
  }
};


//login-get
const loadlogin = async (req, res) => {
  try {
    res.render("auth/login", { message: null, url: "/login" });
  } catch (err) {
    console.log(err);
  }
};


//login-post
const autheticateUser = async (req, res) => {
  try {
    const userData = await User.findOne({ username: req.body.username });

    if (userData) {
      const passMatch = await bcrypt.compare(
        req.body.password,
        userData.passwordHash
      );
      if (passMatch) {
        if (!userData.access) {
          res.render("auth/login", {
            message: "Your account is blocked",
            url: "/login",
          });
        } else if (!userData.isVerified) {
          res.render("auth/login", {
            message: "Please verify your email",
            url: "/login",
          });
        } else {
          req.session.user = userData.username;
          req.session.user_id = userData._id;
          req.session.isAdmin = userData.isAdmin;
          if (req.body.remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
          } else {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
          }
          if(userData.isAdmin){
            res.redirect('/admin/customer')
          }
          else{
            res.redirect("/");
          }
          
        }
      } else {
        res.render("auth/login", { message: "Wrong password", url: "/login" });
      }
    } else {
      res.render("auth/login", {
        message: "user does not exist",
        url: "/login",
      });
    }
  } catch (error) {
    res.send(error);
  }
};


//logout-get
const loadLogout = async (req, res) => {
  try {
    req.session.user = null;
    res.clearCookie("user");
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};


//Change Password Profile-get
const loadChangePassword = async (req, res) => {
  try {
    const userData = await User.findOne({ username: req.session.user });
    res.render("auth/changepass", {
      message: null,
      user: userData,
      url: "profile",
      cartCount:res.locals.count ,wishCount:res.locals.wishlist
    });
  } catch (error) {
    res.send(error);
  }
};


//Change Password Profile-post
const changePasssword = async (req, res) => {
  try {
    const old = req.body.old;
    const now = req.body.password;
    const userData = await User.findOne({ username: req.session.user });
    const passMatch = await bcrypt.compare(req.body.old, userData.passwordHash);
    if (passMatch) {
      const spass = await securePassword(now);
      await User.findByIdAndUpdate(
        { _id: req.session.user_id },
        { passwordHash: spass }
      );
      res.render("auth/passreset", { user: req.session.user });
    } else {
      res.render("auth/changepass", {
        message: "Please enter your current password",
        user: userData,
        url: "profile",
      });
    }
  } catch (error) {
    res.send(error);
  }
};


//forgot password-get
const loadForgotPassword = async (req, res) => {
  try {
    res.render("auth/forgotpass", { message: null });
  } catch (error) {
    res.send(error);
  }
};


//forgot password-post
const ForgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    if (user) {
      const passLink = crypto.randomBytes(18).toString("hex");
      const password = {
        hash: passLink,
        user: user._id,
      };
      res.cookie("password", password, {
        maxAge: 10 * 60 * 1000,
        httpOnly: true,
      });
      await mail.sendMail(user, passLink);
      res.render("auth/forgotpass", {
        message: "The email to recover your password has been sent. Please proceed.",
      });
    }else{
      res.render("auth/forgotpass", { message: "user does not exist"});
    }
  } catch (error) {
    res.send(error);
  }
};


//Change Password Forgot -get
const loadResetPassword = async (req, res) => {
  try {
    if (req.cookies.password) {
      const passCookie = req.cookies.password;
      const passLink = passCookie.hash;
      res.render("auth/reset", { message: null, url: passLink });
    } else {
      res.send("Error");
    }
  } catch (error) {
    res.send(error);
  }
};


//Change Password Forgot -post
const resetPassword = async (req, res) => {
  try {
    const passCookie = req.cookies.password;
    const passLink = passCookie.passLink;
    const user = passCookie.user;
    const spass = await securePassword(req.body.password);
    const userData = await User.findByIdAndUpdate(
      { _id: user },
      { $set: { passwordHash: spass } }
    );
    if (req.session.user) {
      res.render("auth/passreset", { user: req.session.user });
    } else {
      res.render("auth/passreset", { user: null });
    }
  } catch (error) {
    res.send(error);
  }
};


// Profile -get
const loadProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    res.render("user/profile", {
      user: userData,
      url: "profile",
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
    });
  } catch (error) {
    res.send(error);
  }
};


//Profile edit -get
const loadEditProfile = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);
    res.render("user/editprofile", {
      user: userData,
      url: "profile",
      message: null,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
    });
  } catch (error) {
    res.send(error);
  }
};


//Profile edit -post
const EditProfile = async (req, res) => {
  try {
    const username = req.body.username;
    if (username === req.session.user) {
      res.redirect(`/user/${username}`);
    } else {
      const exist = await User.findOne({ user: username });
      if (exist) {
        res.render("user/editprofile", {
          user: userData,
          url: "profile",
          message: "username already taken",
          cartCount: res.locals.count,
          wishCount: res.locals.wishlist,
        });
      } else {
        await User.findByIdAndUpdate(
          { _id: req.session.user_id },
          { $set: { username: username } }
        );
        req.session.user=username;
        res.redirect(`/user/${username}`);
      }
    }
  } catch (error) {
    res.send(error);
  }
};


module.exports = {
  loadlogin,
  loadSignup,
  insertUser,
  autheticateUser,
  loadOtp,
  otp,
  resendOTP,
  loadLogout,
  loadProfile,
  loadEditProfile,
  EditProfile,
  loadForgotPassword,
  ForgotPassword,
  loadResetPassword,
  resetPassword,
  loadChangePassword,
  changePasssword,
};
