const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/auth");
const {
  viewProfile,
  editProfile,
  changePassword,
} = require("../controllers/profileController");

router.get("/view", userAuth, viewProfile);
router.patch("/edit", userAuth, editProfile);
router.patch("/password", userAuth, changePassword);

module.exports = router;
