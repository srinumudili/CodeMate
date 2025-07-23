// routes/chat.js
const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

const router = express.Router();

router.get("/chat/:targetId", userAuth, async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;

    const isConnected = await ConnectionRequest.findOne({
      $or: [
        { fromUserId: userId, toUserId: targetId },
        { fromUserId: targetId, toUserId: userId },
      ],
      status: "accepted",
    });

    if (!isConnected) {
      return res
        .status(403)
        .json({
          authorized: false,
          message: "You are not connected to this user.",
        });
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId, targetId] },
    })
      .populate({
        path: "messages.senderId",
        select: "firstName lastName",
      })
      .populate({
        path: "participants",
        select: "firstName lastName profileUrl",
      });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetId],
        messages: [],
      });
      await chat.save();
      chat = await chat.populate(
        "participants",
        "firstName lastName profileUrl"
      );
    }

    res.json({
      authorized: true,
      participants: chat.participants,
      messages: chat.messages,
    });
  } catch (error) {
    res.status(400).send(`ERROR: ${error}`);
  }
});

module.exports = router;
