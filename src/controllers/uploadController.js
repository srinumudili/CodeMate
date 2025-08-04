const User = require("../models/user");

exports.uploadProfileImage = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("File:", req.file);
    console.log("User ID:", req.user?._id);

    // Check if file exists
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user._id) {
      console.log("No user in request");
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    // Find user in database
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log("User not found in database");
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update user profile URL
    const profileUrl = req.file.path || req.file.secure_url;
    console.log("New profile URL:", profileUrl);

    user.profileUrl = profileUrl;
    await user.save();
    console.log("Profile image updated successfully");

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully.",
      data: {
        profileUrl: user.profileUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Something went wrong during image upload.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};
