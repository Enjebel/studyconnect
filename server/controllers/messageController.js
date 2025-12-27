const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;
        
        const newMessage = new Message({
            conversationId,
            sender: req.user.id,
            text,
            fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
            fileType: req.file ? req.file.mimetype : null
        });

        const savedMessage = await newMessage.save();

        // Update the conversation's last message for the sidebar
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: savedMessage._id
        });

        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('sender', 'username profilePic');

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .populate('sender', 'username profilePic')
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};