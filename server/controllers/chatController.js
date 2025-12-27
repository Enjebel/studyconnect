const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Start or Get a Private Chat
exports.startPrivateChat = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user.id;

        // Look for a private chat where BOTH users are participants
        let chat = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [senderId, recipientId] }
        });

        if (!chat) {
            chat = new Conversation({
                participants: [senderId, recipientId],
                isGroup: false
            });
            await chat.save();
        }

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all conversations for the sidebar (WhatsApp Home Screen)
exports.getUserChats = async (req, res) => {
    try {
        const chats = await Conversation.find({
            participants: { $in: [req.user.id] }
        })
        .populate('participants', 'username profilePic isOnline')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};