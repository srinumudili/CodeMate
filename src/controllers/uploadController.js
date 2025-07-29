const User = require("../models/user");

exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileUrl: req.file.path },
      { new: true }
    ).select("-password -__v");

    res.status(200).json({
      message: "Profile image uploaded successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};
