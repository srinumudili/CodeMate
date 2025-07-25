const bcrypt = require("bcryptjs");
const validator = require("validator");
const { validateProfileEditData } = require("../utils/Validation");

exports.viewProfile = async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
};

exports.editProfile = async (req, res) => {
  try {
    if (!validateProfileEditData(req)) {
      throw new Error("Unable to edit the profile data!!");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach((key) => {
      loggedInUser[key] = req.body[key];
    });

    await loggedInUser.save();
    const { password, ...safeUser } = loggedInUser.toObject();

    res.status(200).json({
      message: `${loggedInUser.firstName} data updated successfully...`,
      data: safeUser,
    });
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new passwords are required." });
    }

    const isPasswordValid = await user.validatePassword(currentPassword);
    const isNewPasswordStrong = validator.isStrongPassword(newPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Password is incorrect." });
    }

    if (!isNewPasswordStrong) {
      return res.status(400).json({
        message:
          "New password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(400).send(`ERROR : ${error.message}`);
  }
};
