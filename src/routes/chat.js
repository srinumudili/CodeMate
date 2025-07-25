// routes/chat.js
const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/auth");
const { getChatWithUser } = require("../controllers/chatController");

router.get("/:targetId", userAuth, getChatWithUser);

module.exports = router;
