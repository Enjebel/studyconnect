const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Create or Get Conversation
exports.createConversation = async (req, res) => {
    try {
        const { senderId, recipientId } = req.body;
        let conversation = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [senderId, recipientId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, recipientId],
                isGroup: false
            });
        }

        const fullConversation = await Conversation.findById(conversation._id)
            .populate("participants", "username profilePic");

        res.status(200).json(fullConversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send Message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, senderId, text, messageType, fileUrl } = req.body;

        const newMessage = await Message.create({
            conversationId,
            sender: senderId,
            text,
            messageType: messageType || 'text',
            fileUrl: fileUrl || ""
        });

        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all chats for sidebar
exports.getConversations = async (req, res) => {
    try {
        const { userId } = req.query;
        const convos = await Conversation.find({ participants: { $in: [userId] } })
            .populate("participants", "username profilePic")
            .sort({ updatedAt: -1 });
        res.json(convos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.convoId });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
