const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

// Ensure consistent participant order to avoid duplicate conversations
conversationSchema.pre("save", function (next) {
  if (this.participants && Array.isArray(this.participants)) {
    this.participants.sort();
  }
  next();
});

// Index for faster conversation lookup by participants and recent updates
conversationSchema.index({ participants: 1, updatedAt: -1 });

// Helper method to check if a user is part of the conversation
conversationSchema.methods.isParticipant = function (userId) {
  return this.participants.some((id) => id.equals(userId));
};

const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
