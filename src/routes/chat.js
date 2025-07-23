const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Chat = require("../models/chat");
const router = express.Router();

router.get("/chat/:targetId", userAuth, async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetId],
        messages: [],
      });
    }

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(400).send(`ERROR: ${error}`);
  }
});

module.exports = router;
