const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const { uploadProfileImage } = require("../controllers/uploadController");
const { userAuth } = require("../middlewares/auth");

const upload = multer({ storage });

router.post(
  "/upload-profile",
  userAuth,
  upload.single("profileImage"),
  uploadProfileImage
);

module.exports = router;
