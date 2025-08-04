const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Log environment variables (without exposing secrets)
console.log("Cloudinary Config Check:");
console.log(
  "CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing"
);
console.log(
  "API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing"
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const testCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log("✅ Cloudinary connection successful");
  } catch (err) {
    console.error("❌ Cloudinary connection failed:", err.message);
  }
};

testCloudinaryConnection();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "codemate_profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "bmp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    // Add these for better reliability
    resource_type: "image",
    public_id: (req, file) => {
      return `profile_${req.user._id}_${Date.now()}`;
    },
  },
});

module.exports = {
  cloudinary,
  storage,
};
