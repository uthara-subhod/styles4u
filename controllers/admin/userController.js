const User = require("../../models/user");


//userlist -get
const loadCustomers = async (req, res) => {
    try {
      
        const userDetails = await User.find({
            isAdmin: false, 
        })

        res.render("admin/customers", { user: userDetails, url:"user", });
    } catch (error) {
        res.send(error)

    }
};


//block user
const block = async (req, res) => {
    try {
        const userDetails = await User.findOneAndUpdate({ _id: req.query.id }, [{ $set: { access: { $eq: [false, "$access"] } } }]);
        res.redirect("/admin/customer");
    } catch (error) {
        res.send(error);
    }
};

const loadLogout = async (req, res) => {
    try {
      req.session.admin = null;
      req.session.admin_id=null
      res.clearCookie("user");
      res.redirect("/");
    } catch (error) {
      console.log(error.message);
    }
  };
  


module.exports = {
    loadCustomers,
    block,
    loadLogout
}
