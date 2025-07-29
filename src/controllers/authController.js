const bcrypt = require("bcryptjs");
const User = require("../models/user");
const { validateSignupData } = require("../utils/Validation");

// Cookie options for cross-origin secure communication
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

//Signup Controller
exports.signup = async (req, res) => {
  try {
    validateSignupData(req);

    const { firstName, lastName, email, password } = req.body;

    const user = new User({
      firstName,
      lastName,
      email,
      password,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token, cookieOptions);
    res
      .status(201)
      .json({ message: "User added successfully.", data: savedUser });
  } catch (error) {
    res.status(400).json({ message: `Error: ${error.message}` });
  }
};

//Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("Invalid Credentials.");

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) throw new Error("Invalid Credentials.");

    const token = await user.getJWT();

    // Remove password before sending response
    user.password = undefined;

    res.cookie("token", token, cookieOptions);
    res.status(200).json({ message: "Login Successful!", data: user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Logout Controller
exports.logout = async (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(Date.now()),
  });
  res.status(200).json({ message: "Logout successful." });
};
