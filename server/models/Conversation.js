const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    // If name exists, it's a Group. If null, it's a Private Chat.
    name: { type: String, default: null }, 
    isGroup: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Only for groups
    privacy: { 
        type: String, 
        enum: ['public', 'private'], 
        default: 'public' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);