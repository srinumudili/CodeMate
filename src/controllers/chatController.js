const Conversation = require("../models/conversation");
const Message = require("../models/message");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

/**
 * GET /api/chat/conversations
 * Fetch user's conversations with pagination + dynamic unread counts
 */
exports.getConversations = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find({ participants: req.user._id })
        .populate("participants", "firstName lastName profileUrl")
        .populate({
          path: "lastMessage",
          select: "text sender receiver createdAt",
          populate: { path: "sender", select: "firstName lastName profileUrl" },
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ participants: req.user._id }),
    ]);

    // Calculate unread count for each conversation dynamically
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiver: req.user._id,
          isRead: false,
          deletedFor: { $ne: req.user._id },
        });
        return { ...conv, unreadCount };
      })
    );

    res.json({
      conversations: conversationsWithUnread,
      meta: { page, limit, total },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/chat/messages/:conversationId
 * Fetch messages in a conversation with pagination
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const skip = (page - 1) * limit;

    const convo = await Conversation.findById(conversationId).lean();
    if (
      !convo ||
      !convo.participants.some(
        (id) => id.toString() === req.user._id.toString()
      )
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [messages, total] = await Promise.all([
      Message.find({
        conversationId,
        deletedFor: { $ne: req.user._id },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "firstName lastName profileUrl")
        .populate("receiver", "firstName lastName profileUrl")
        .lean(),
      Message.countDocuments({
        conversationId,
        deletedFor: { $ne: req.user._id },
      }),
    ]);

    // Optionally, mark first page messages as read
    if (page === 1) {
      await Message.updateMany(
        { conversationId, receiver: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );
    }

    res.json({ messages: messages.reverse(), meta: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/chat/connections
 * Fetch user's accepted connections
 */
exports.getConnections = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromUserId: req.user._id, status: "accepted" },
        { toUserId: req.user._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", "firstName lastName profileUrl _id")
      .populate("toUserId", "firstName lastName profileUrl _id")
      .skip(skip)
      .limit(limit)
      .lean();

    const connections = connectionRequests.map((conn) => {
      if (conn.fromUserId._id.toString() === req.user._id.toString())
        return conn.toUserId;
      return conn.fromUserId;
    });

    const total = await ConnectionRequest.countDocuments({
      $or: [
        { fromUserId: req.user._id, status: "accepted" },
        { toUserId: req.user._id, status: "accepted" },
      ],
    });

    res.json({ connections, meta: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/chat/conversation
 * Create or get existing conversation between two users
 */
exports.createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId)
      return res.status(400).json({ error: "Participant ID is required" });
    if (participantId === req.user._id.toString())
      return res
        .status(400)
        .json({ error: "Cannot create conversation with yourself" });

    const connection = await ConnectionRequest.findOne({
      $or: [
        {
          fromUserId: req.user._id,
          toUserId: participantId,
          status: "accepted",
        },
        {
          fromUserId: participantId,
          toUserId: req.user._id,
          status: "accepted",
        },
      ],
    });

    if (!connection)
      return res
        .status(403)
        .json({ error: "You can only message your connections" });

    const participants = [req.user._id, participantId].sort();
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
    });
    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    await conversation.populate(
      "participants",
      "firstName lastName profileUrl"
    );
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/chat/messages
 * Send a new message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text, attachments = [] } = req.body;
    if (!text?.trim() && attachments.length === 0) {
      return res
        .status(400)
        .json({ error: "Message must have text or attachments" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Access denied to this conversation" });
    }

    const receiverId = conversation.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    const message = new Message({
      conversationId,
      sender: req.user._id,
      receiver: receiverId,
      text: text?.trim(),
      attachments,
    });
    await message.save();

    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate("sender", "firstName lastName profileUrl");
    await message.populate("receiver", "firstName lastName profileUrl");

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/chat/messages/:messageId
 * Soft delete a message for current user
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.sender.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });

    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
