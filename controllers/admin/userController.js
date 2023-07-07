const User = require("../../models/user");


//userlist -get
const loadCustomers = async (req, res) => {
    try {
        const count =await User.countDocuments() ;
        const totalPages = Math.round(count / 5);
        if (req.query.page) {
          var page = parseInt(req.query.page) || 1;
        } else {
          var page = 1;
        }
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        const userDetails = await User.find({
            isAdmin: false,
            $or: [
                { email: { $regex: new RegExp(search, "i") } },
                { username: { $regex: new RegExp(search, "i") } },
            ],
        }).skip((page - 1) * 5)
        .limit(5);

        res.render("admin/customers", { user: userDetails,page,totalPages, url:"user", });
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


module.exports = {
    loadCustomers,
    block,
}
