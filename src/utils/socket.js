const { Server } = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
require("dotenv").config();

const getSecretRoomId = (userId, targetId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // ✅ Join room securely
    socket.on("joinChat", async ({ firstName, lastName, userId, targetId }) => {
      const isConnected = await ConnectionRequest.findOne({
        $or: [
          { fromUserId: userId, toUserId: targetId },
          { fromUserId: targetId, toUserId: userId },
        ],
        status: "accepted",
      });

      if (!isConnected) {
        socket.emit(
          "unauthorized",
          "You are not allowed to chat with this user."
        );
        return;
      }

      const roomId = getSecretRoomId(userId, targetId);
      socket.join(roomId);
      console.log(`${firstName} ${lastName} joined room ${roomId}`);
    });

    // ✅ Send message securely
    socket.on(
      "sendMessage",
      async ({ firstName, lastName, senderId, receiverId, text }) => {
        try {
          const isConnected = await ConnectionRequest.findOne({
            $or: [
              { fromUserId: senderId, toUserId: receiverId },
              { fromUserId: receiverId, toUserId: senderId },
            ],
            status: "accepted",
          });

          if (!isConnected) {
            socket.emit(
              "unauthorized",
              "You are not allowed to send messages to this user."
            );
            return;
          }

          const roomId = getSecretRoomId(senderId, receiverId);

          let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [senderId, receiverId],
              messages: [],
            });
          }

          chat.messages.push({
            senderId,
            text,
          });

          await chat.save();

          io.to(roomId).emit("receiveMessage", {
            firstName,
            lastName,
            text,
            senderId,
          });
        } catch (error) {
          console.error("Socket sendMessage error:", error.message);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

module.exports = initializeSocket;
