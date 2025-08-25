// socket.js
const { Server } = require("socket.io");
const socketAuth = require("../middlewares/socketAuth");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const ConnectionRequest = require("../models/connectionRequest");

let io;

// Track all active sockets per user
const connectedUsers = new Map(); // userId => [socketId1, socketId2, ...]

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.firstName} (${socket.id})`);

    // Track multiple connections per user
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, []);
    connectedUsers.get(userId).push({ socketId: socket.id, user: socket.user });

    // Emit current online users to the connected client
    socket.emit("onlineUsers", getConnectedUsers());

    // Join personal room
    socket.join(userId);

    // Notify connections that this user is online
    broadcastUserStatus(userId, true);

    /** ---------------- New Event: Request Online Users ---------------- **/
    socket.on("requestOnlineUsers", () => {
      socket.emit("onlineUsers", getConnectedUsers());
    });

    /** ---------------- Chat Events ---------------- **/

    socket.on("joinChat", async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(userId)) {
          return socket.emit("error", { message: "Access denied" });
        }
        socket.join(conversationId);
        socket.to(conversationId).emit("userJoined", {
          userId,
          user: socket.user,
        });
      } catch (err) {
        console.error("joinChat error:", err);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    socket.on(
      "sendMessage",
      async ({ conversationId, receiverId, text, attachments = [] }) => {
        try {
          if (!receiverId || (!text?.trim() && attachments.length === 0)) {
            return socket.emit("error", {
              message: "Message content is empty",
            });
          }

          const connected = await checkIfUsersConnected(userId, receiverId);
          if (!connected)
            return socket.emit("error", {
              message: "You can only message your connections",
            });

          let conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            conversation = await Conversation.create({
              participants: [userId, receiverId].sort(),
            });
          }

          if (!conversation.isParticipant(userId))
            return socket.emit("error", { message: "Access denied" });

          const message = await Message.create({
            conversationId: conversation._id,
            sender: userId,
            receiver: receiverId,
            text: text?.trim(),
            attachments,
          });

          await message.populate([
            { path: "sender", select: "firstName lastName profileUrl" },
            { path: "receiver", select: "firstName lastName profileUrl" },
          ]);

          conversation.lastMessage = message._id;
          conversation.updatedAt = new Date();
          await conversation.save();

          // Populate the conversation for complete data
          await conversation.populate([
            { path: "participants", select: "firstName lastName profileUrl" },
            { path: "lastMessage" },
          ]);

          const messageData = {
            _id: message._id,
            conversationId: message.conversationId,
            sender: message.sender,
            receiver: message.receiver,
            text: message.text,
            attachments: message.attachments,
            isRead: message.isRead,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          };

          // Enhanced payload with conversation data for new conversations
          const enhancedPayload = {
            ...messageData,
            conversationData: {
              _id: conversation._id,
              participants: conversation.participants,
              lastMessage: messageData,
              updatedAt: conversation.updatedAt,
              createdAt: conversation.createdAt,
            },
          };

          // Emit to conversation room
          io.to(conversation._id.toString()).emit(
            "receiveMessage",
            enhancedPayload
          );

          // Also emit to individual participants to ensure they get the message
          // even if they haven't joined the conversation room yet
          conversation.participants.forEach((participant) => {
            io.to(participant._id.toString()).emit(
              "receiveMessage",
              enhancedPayload
            );
          });
        } catch (err) {
          console.error("sendMessage error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("markAsRead", async ({ conversationId, messageIds }) => {
      try {
        if (!conversationId || !Array.isArray(messageIds)) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(userId))
          return socket.emit("error", { message: "Access denied" });

        await Message.updateMany(
          { _id: { $in: messageIds }, receiver: userId, conversationId },
          { isRead: true }
        );
        socket
          .to(conversationId)
          .emit("messagesRead", { conversationId, messageIds, readBy: userId });
      } catch (err) {
        console.error("markAsRead error:", err);
      }
    });

    socket.on("deleteMessage", async ({ messageId, conversationId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message)
          return socket.emit("error", { message: "Message not found" });
        if (message.sender.toString() !== userId)
          return socket.emit("error", {
            message: "Cannot delete others' messages",
          });

        if (!message.deletedFor.includes(userId)) {
          message.deletedFor.push(userId);
          await message.save();
        }

        io.to(conversationId).emit("messageDeleted", {
          messageId,
          conversationId,
          deletedBy: userId,
        });
      } catch (err) {
        console.error("deleteMessage error:", err);
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("userTyping", {
        conversationId,
        userId,
        user: {
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
        },
        isTyping,
      });
    });

    socket.on("leaveChat", ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(conversationId);
      socket.to(conversationId).emit("userLeft", { userId, user: socket.user });
    });

    /** ---------------- Logout Event ---------------- **/
    socket.on("logout", async () => {
      handleSocketDisconnect(userId, socket.id);
    });

    /** ---------------- Disconnect Event ---------------- **/
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.firstName} (${socket.id})`);
      handleSocketDisconnect(userId, socket.id);
    });
  });

  return io;
};

/* ---------- HELPERS ---------- */

// Check if two users are connected
const checkIfUsersConnected = async (userId1, userId2) => {
  try {
    const connection = await ConnectionRequest.findOne({
      $or: [
        { fromUserId: userId1, toUserId: userId2, status: "accepted" },
        { fromUserId: userId2, toUserId: userId1, status: "accepted" },
      ],
    });
    return Boolean(connection);
  } catch (err) {
    console.error("checkIfUsersConnected error:", err);
    return false;
  }
};

// Broadcast online/offline status to connections
const broadcastUserStatus = async (userId, isOnline, lastSeen = null) => {
  try {
    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: userId, status: "accepted" },
        { toUserId: userId, status: "accepted" },
      ],
    }).populate("fromUserId toUserId", "_id");

    const connectedUserIds = connections.map((conn) =>
      conn.fromUserId._id.toString() === userId
        ? conn.toUserId._id.toString()
        : conn.fromUserId._id.toString()
    );

    connectedUserIds.forEach((uid) => {
      io.to(uid).emit("userStatusChange", {
        userId,
        isOnline,
        lastSeen: isOnline ? null : lastSeen,
      });
    });
  } catch (err) {
    console.error("broadcastUserStatus error:", err);
  }
};

const handleSocketDisconnect = (userId, socketId) => {
  const sockets = connectedUsers.get(userId) || [];
  const idx = sockets.findIndex((s) => s.socketId === socketId);
  if (idx !== -1) sockets.splice(idx, 1);

  if (sockets.length === 0) {
    connectedUsers.delete(userId);
    broadcastUserStatus(userId, false, new Date());
  }
};

// Utility: get connected users snapshot
const getConnectedUsers = () =>
  Array.from(connectedUsers.entries()).map(([userId, sockets]) => ({
    userId,
    user: sockets[0]?.user,
    isOnline: true,
    lastSeen: null,
  }));

module.exports = {
  initializeSocket,
  getConnectedUsers,
  handleSocketDisconnect,
  getIO: () => io,
};
