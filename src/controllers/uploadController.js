const User = require("../models/user");

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.profileUrl = req.file.path;
    await user.save();
    res
      .status(200)
      .json({ message: "Profile image updated.", profileUrl: user.profileUrl });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong during image upload.",
      error: error.message,
    });
  }
};
