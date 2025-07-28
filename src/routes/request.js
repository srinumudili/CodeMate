const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/auth");

const {
  sendConnectionRequest,
  reviewConnectionRequest,
} = require("../controllers/requestController");

router.post("/send/:toUserId", userAuth, sendConnectionRequest);
router.patch("/review/:requestId", userAuth, reviewConnectionRequest);

module.exports = router;
