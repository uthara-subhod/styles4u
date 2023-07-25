const Address = require("../../models/address");
const User = require("../../models/user");


//address -get
const loadAddress = async (req, res) => {
  try {
    const username = req.session.user;
    const userData = await User.findOne({ username: username });
    const addresses = await Address.find({ user: userData._id });

    const contact = addresses.find((add) => {
      return add.type === "contact";
    });

    const main = addresses.find((add) => {
      return add.type === "main";
    });

    const secondary = addresses.filter((add) => {
      return add.type === "secondary";
    });

    res.render(`user/address`, {
      contact: contact,
      main: main,
      secondary: secondary,
      user: userData,
      url: "address",
      message: null,
      cartCount: res.locals.count,
      wishCount: res.locals.wishlist,
    });

  } catch (err) {
    res.send(err);
  }
};


//add address -get
const loadAddAddress = async (req, res) => {
  try {
    const type = req.query.type;
    const username = req.session.user;
    const userData = await User.findOne({ username: username });

    if (req.query.id) {
      var address = await Address.findOne({ _id: req.query.id, type: type, user: userData._id })
    } else if(type!="secondary"){
      var address = await Address.findOne({ type: type, user: userData._id })
    }

    if (address) {
      res.render("user/editAddress", {
        address: address,
        type: type,
        user: userData,
        url: "address",
        message: null,
        cartCount: res.locals.count,
        wishCount: res.locals.wishlist,
      });
    } else {
      res.render("user/editAddress", {
        address: null,
        type: type,
        user: userData,
        url: "address",
        message: null,
        cartCount: res.locals.count,
        wishCount: res.locals.wishlist,
      });
    }

  } catch (err) {
    res.send(err);
  }
};


//add address -post
const addAddress = async (req, res) => {
  try {
    const user = req.session.user_id;
    const username = req.session.user;
    const { building, street, city, state, zip, country, phone, type, id } = req.body;

    if (id) {
      await Address.findByIdAndUpdate(
        id,
        {
          $set: {
            buildingName: building,
            street: street,
            city: city,
            state: state,
            zipCode: zip,
            country: country,
            phoneNumber: phone,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );
    } else {
      await new Address({
        user:user,
        type:type,
        buildingName: building,
        street: street,
        city: city,
        state: state,
        zipCode: zip,
        country: country,
        phoneNumber: phone,
      }).save()
    }

    res.redirect(`/user/address`);
  } catch (err) {
    res.send(err);
  }
};


//delete address
const deleteAddress=async(req,res)=>{
  try{
    await Address.findByIdAndDelete(req.query.id)
    res.json({ response: true });
  }catch(err){
    res.send(err)
  }
}


module.exports = {
  loadAddress,
  loadAddAddress,
  addAddress,
  deleteAddress
};
