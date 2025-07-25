// controllers/chatController.js
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");

exports.getChatWithUser = async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check connection
    const isConnected = await ConnectionRequest.findOne({
      $or: [
        { fromUserId: userId, toUserId: targetId },
        { fromUserId: targetId, toUserId: userId },
      ],
      status: "accepted",
    });

    if (!isConnected) {
      return res.status(403).json({
        authorized: false,
        message: "You are not connected to this user.",
      });
    }

    // Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetId],
        messages: [],
      });
      await chat.save();
    }

    // Populate participants and messages.senderId
    await chat.populate([
      { path: "participants", select: "firstName lastName profileUrl" },
      { path: "messages.senderId", select: "firstName lastName" },
    ]);

    const totalMessages = chat.messages.length;

    const paginatedMessages = chat.messages
      .slice()
      .reverse()
      .slice(skip, skip + limit)
      .reverse();

    res.status(200).json({
      authorized: true,
      participants: chat.participants,
      messages: paginatedMessages,
      page,
      totalMessages,
    });
  } catch (error) {
    console.error("Chat fetch error:", error);
    res.status(500).json({ error: error.message });
  }
};
