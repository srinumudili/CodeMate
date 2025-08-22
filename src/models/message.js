const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        url: String,
        fileType: String, // image, video, document
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Ensure messages have at least text or attachment
messageSchema.pre("save", function (next) {
  if (!this.text && (!this.attachments || this.attachments.length === 0)) {
    return next(new Error("Message must have text or an attachment"));
  }
  next();
});

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 }); // pagination
messageSchema.index({ receiver: 1, isRead: 1 }); // unread counts

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
