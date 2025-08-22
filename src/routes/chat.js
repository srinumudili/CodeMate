const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { userAuth } = require("../middlewares/auth"); // your JWT auth middleware

/**
 * Conversations
 */
// Get all user's conversations (with dynamic unread counts)
router.get("/conversations", userAuth, chatController.getConversations);

// Create or get existing conversation with a participant
router.post("/conversation", userAuth, chatController.createOrGetConversation);

/**
 * Messages
 */
// Get messages in a conversation with pagination
router.get("/messages/:conversationId", userAuth, chatController.getMessages);

// Send a new message
router.post("/messages", userAuth, chatController.sendMessage);

// Soft delete a message for current user
router.delete("/messages/:messageId", userAuth, chatController.deleteMessage);

/**
 * Connections
 */
// Get user's accepted connections to start new conversations
router.get("/connections", userAuth, chatController.getConnections);

module.exports = router;
