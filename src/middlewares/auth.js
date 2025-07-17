const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userAuth = async (req, res, next) => {
  try {
    //Reading cookies
    const cookies = req.cookies;
    const { token } = cookies;

    if (!token) {
      return res.status(401).send("Please Login!");
    }

    const decodedObj = jwt.verify(token, "DevTinder@78678");
    const { _id } = decodedObj;

    const user = await User.findById(_id);
    if (!user) {
      throw new Error("User Not Found!!!");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
};

module.exports = {
  userAuth,
};
