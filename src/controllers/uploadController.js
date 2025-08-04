const User = require("../models/user");

exports.uploadProfileImage = async (req, res) => {
  try {
    console.log("User:", req.user);
    console.log("File:", req.file);

    if (!req.file) {
      console.error("❌ No file received.");
      return res.status(400).json({ message: "No file uploaded." });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      console.error("❌ User not found.");
      return res.status(404).json({ message: "User not found." });
    }

    user.profileUrl = req.file.path;
    await user.save();

    console.log("✅ Profile image updated:", user.profileUrl);
    res
      .status(200)
      .json({ message: "Profile image updated.", profileUrl: user.profileUrl });
  } catch (error) {
    console.error("❌ Upload error:", error.message);
    res.status(500).json({
      message: "Something went wrong during image upload.",
      error: error.message,
    });
  }
};
