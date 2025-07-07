const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minLength: 4,
      maxLength: 18,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw new Error("Invalid email address");
        }
      },
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum: ["male", "female", "others"],
      message: "Gender must be 'male', 'female', or 'others'",
    },
    profileUrl: {
      type: String,
      validate(val) {
        if (!validator.isURL(val)) {
          throw new Error(`Invalid Profile URL: ${val}`);
        }
      },
    },
    about: {
      type: String,
      default: "This is the default about of the user",
    },
    skills: {
      type: [String],
    },
  },
  { timestamps: true }
);

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, "DevTinder@78678", {
    expiresIn: "1d",
  });

  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const hashedPassword = user.password;

  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    hashedPassword
  );

  return isPasswordValid;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
