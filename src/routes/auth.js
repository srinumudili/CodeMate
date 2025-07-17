const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { validateSignupData } = require("../utils/Validation");
const User = require("../models/user");

router.post("/signup", async (req, res) => {
  try {
    //validating the data
    validateSignupData(req);
    const { firstName, lastName, email, password } = req.body;
    //encryptiing the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //creating an instance
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.send("User Data added successfully..");
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid Credentials.");
    }
    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      //create jwt token
      const token = await user.getJWT();
      res.cookie("token", token);
      res.status(200).json({ message: "Login Successfull!", data: user });
    } else {
      throw new Error("Invalid Credentials.");
    }
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
});

//logout
router.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout Successful");
});

module.exports = router;
