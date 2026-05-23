const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Conversation" 
    },
    sender: { 
        type: mongoose.Schema.Types.Mixed,
        ref: "User"
    },
    senderName: { type: String, default: "" },
    text: { type: String },
    time: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    messageType: { type: String, default: "text" },
    // status can be 'delivered' or 'read'
    status: { type: String, default: "delivered" } 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
