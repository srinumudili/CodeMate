const validator = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Name is invalid.");
  } else if (!validator.isEmail(email)) {
    throw new Error("Email is invalid.");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password.");
  }
};

const validateProfileEditData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "email",
    "age",
    "gender",
    "profileUrl",
    "about",
    "skills",
  ];
  const isAllowedUpdate = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );

  return isAllowedUpdate;
};

module.exports = {
  validateSignupData,
  validateProfileEditData,
};
