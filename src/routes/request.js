const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/auth");

const {
  sendConnectionRequest,
  reviewConnectionRequest,
} = require("../controllers/requestController");

router.post("/:toUserId", userAuth, sendConnectionRequest);
router.post("/review/:requestId", userAuth, reviewConnectionRequest);

module.exports = router;
