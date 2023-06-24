const Address = require("../models/address");

const loadAddress = async (req, res) => {
  const username = req.params.username;
  const addresses = await Address.find({ user: username });
  const contact = addresses.find((add) => {
    return add.type === "contact";
  });
  const main = addresses.find((add) => {
    return add.type === "main";
  });
  const secondary = addresses.filter((add) => {
    return add.type === "secondary";
  });
  res.render(`user/addresses`, {
    contact: contact,
    main: main,
    secondary: secondary,
  });
};

const loadAddAddress = async (req, res) => {
  const type = req.query.type;
  const username = req.params.username;
  const address = await Address.findOne({ type: type, user: username });
  if (address) {
    res.render("user/address", { address: address, type: type });
  } else {
    res.render("user/address", { address: null, type: type });
  }
};

const addAddress = async (req, res) => {
  const username = req.params.username;
  const { building, street, city, state, zip, country, phone, type } = req.body;
  const address = await Address.findOneAndUpdate(
    {
      user: username,
      type: type,
    },
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
        upsert:true,
        new:true
    }
  );

res.redirect(`/user/${username}/addresses`)
};
