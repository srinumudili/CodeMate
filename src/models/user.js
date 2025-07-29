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
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email address",
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    age: {
      type: Number,
      min: [18, "Age must be at least 18"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: "Gender must be 'male', 'female', or 'others'",
      },
    },
    profileUrl: {
      type: String,
      default: function () {
        if (!process.env.CLOUDINARY_CLOUD_NAME) return undefined;
        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1753781457/defaultAvatar_mjdmpo.jpg`;
      },
      validate: {
        validator: validator.isURL,
        message: "Invalid Profile URL",
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

//Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//Instance method to generate JWT
userSchema.methods.getJWT = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

//Instance method to validate password
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  return await bcrypt.compare(passwordInputByUser, this.password);
};

// Clean up sensitive fields when sending data
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
