const { Server } = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");

const getSecretRoomId = (userId, targetId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetId].sort().join("_"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ firstName, lastName, userId, targetId }) => {
      const roomId = getSecretRoomId(userId, targetId);
      socket.join(roomId);
      console.log(`${firstName} ${lastName} has joined room ${roomId}`);
    });
    socket.on(
      "sendMessage",
      async ({ firstName, lastName, senderId, receiverId, text }) => {
        try {
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
          console.error(error);
        }
      }
    );
    socket.on("disconnect", () => {
      console.log("Disconnected!!!");
    });
  });
};

module.exports = initializeSocket;
