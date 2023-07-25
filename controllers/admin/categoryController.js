const Category = require("../../models/category");
const Product = require("../../models/product");


//catgeory list -get
const loadCategory = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $unwind: {
          path: "$sub",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    const productValue = [];
    for (let i = 0; i < categories.length; i++) {
      if (!categories[i].sub) {
        productValue[i] = await Product.findOne({
          category: categories[i].name,
        });
      } else {
        productValue[i] = await Product.findOne({
          category: categories[i].name,
          subcategory: categories[i].sub,
        });
      }
    }

    res.render("admin/categories", {
      url: "category",
      cat: categories,
      items: productValue,

    });
  } catch (error) {
    res.send(error);
  }
};


//add category -get
const loadAddCategory = async (req, res) => {
  try {
    res.render("admin/category", {
      url: "category",
      name: null,
      message: null,
      color: null,
    });
  } catch (error) {
    res.send(error);
  }
};


//add sub category -get
const loadAddSub = async (req, res) => {
  try {
    const cat = await Category.find();
    res.render("admin/subcategory", {
      url: "category",
      cat,
      sub: null,
      message: null,
      color: null,
    });
  } catch (error) {
    res.send(error);
  }
};


//add category -post
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingCategory) {
      res.render("admin/category", {
        url: "category",
        name: null,
        message: "Already Exists",
        color: "red",
      });
    } else {
      await new Category({ name: name, sub: [] }).save();
      res.render("admin/category", {
        url: "category",
        name: null,
        message: "Catgeory Added",
        color: "green",
      });
    }
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).send("Internal Server Error");
  }
};


//add subcategory -post
const addSub = async (req, res) => {
  try {
    const { name, sub } = req.body;
    const cat=await Category.find();
    const existingCategory = await Category.findOne({
      name: name,
      sub: { $in: [sub] },
    });
    if (!existingCategory) {
      await Category.findOneAndUpdate(
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
        { $addToSet: { sub: sub } },
        { upsert: true, new: true }
      );
      res.render("admin/subcategory", {
        url: "category",
        cat,
        sub: null,
        message: "Category Added",
        color: "green",
      });
    } else {
      res.render("admin/subcategory", {
        url: "category",
        cat,
        sub: null,
        message: "Catgeory Already Exists",
        color: "red",
      });
    }
  } catch (err) {
    res.send(err);
  }
};


//delete subcategory
const deleteCategory = async (req, res) => {
  try {
    if (req.query.sub) {
      const category = await Category.findByIdAndUpdate(
        req.query.id,
        { $pull: { sub: req.query.sub } },
        { new: true }
      );
    } else {
      await Category.findOneAndDelete({ name: req.query.name });
    }
    res.redirect("/admin/category");
  } catch (error) {
    res.send(error);
  }
};


//category edit -get
const loadEditCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ name: req.query.name });
    res.render("admin/category", {
      url: "category",
      name: req.query.name,
      message: null,
      color: null,
    });
  } catch (err) {
    res.send(err);
  }
};


//subcategory edit -get
const loadEditSub =async (req,res) =>{
  try {
    const cat= await Category.findOne();
    res.render("admin/subcategory", {
      url: "category",
      cat,
      sub:req.query.sub,
      message: null,
      color: null,
    });
  } catch (err) {
    res.send(err);
  }
}


//category edit -post
const editCategory = async (req, res) => {
  try {
    const cat = await Category.findOneAndUpdate(
      { name: req.query.name },
      { $set: { name: req.body.name } }
    );
    res.render("admin/category", {
      name: cat.name,
      message: "Category Edited",
      color: "green",
    });
  } catch (error) {
    res.send(error);
  }
};


//subcategory edit -post
const editSub = async (req, res) => {
  if (req.query.sub) {
    const sub = req.body.sub;
    const cat = await Category.find();
    const category = await Category.findOneAndUpdate(
      { name: req.body.name },
      { $set: { "sub.$[element]": sub, name: req.body.name } },
      { arrayFilters: [{ element: { $eq: req.query.sub } }], new: true }
    );
    res.render("admin/subcategory", {
      url: "category",
      cat,
      sub,
      message: "Category Edited",
      color: "green",
    });
  }
};



module.exports = {
  loadCategory,
  loadAddCategory,
  addCategory,
  deleteCategory,
  loadEditCategory,
  editCategory,
  loadAddSub,
  addSub,
  loadEditSub,
  editSub
};
