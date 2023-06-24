const isLogOut = async (req, res, next) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
};
const isLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};

const admin = async (req, res, next) => {
  try {
    if (req.session.user && req.session.isAdmin) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error);
  }
};
module.exports = {
  isLogin,
  isLogOut,
  admin,
};
