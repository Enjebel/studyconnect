const router = require("express").Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const memoryMessages = [
    {
        id: "seed-1",
        contactId: "nyami",
        sender: "nyami",
        senderName: "nyami lewis",
        text: "Did you finish the physics report?",
        time: "08:42",
        status: "read",
        createdAt: new Date()
    }
];

const isDbReady = () => mongoose.connection.readyState === 1;

// GET RECENT MESSAGES FOR THE SIMPLE CHAT SCREEN
router.get("/", async (req, res) => {
    try {
        if (!isDbReady()) {
            return res.status(200).json(memoryMessages);
        }

        const messages = await Message.find({})
            .sort({ createdAt: 1 })
            .limit(100);
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: "Error fetching messages", error: err.message });
    }
});

// CREATE A MESSAGE FROM THE SIMPLE CHAT SCREEN
router.post("/", async (req, res) => {
    try {
        const { text, sender, senderName, time, contactId } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message text is required" });
        }

        if (!isDbReady()) {
            const message = {
                id: `memory-${Date.now()}`,
                contactId: contactId || "nyami",
                text: text.trim(),
                sender: sender || "local-user",
                senderName: senderName || "You",
                time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                status: "delivered",
                createdAt: new Date()
            };
            memoryMessages.push(message);
            return res.status(201).json(message);
        }

        const savedMessage = await Message.create({
            text: text.trim(),
            sender: sender || "local-user",
            senderName: senderName || "You",
            time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "delivered"
        });

        res.status(201).json(savedMessage);
    } catch (err) {
        res.status(500).json({ message: "Error saving message", error: err.message });
    }
});

// GET ALL CONVERSATIONS FOR A USER
router.get("/conversations", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!isDbReady()) {
            return res.status(200).json([]);
        }
        
        // Populate participants to get usernames/avatars for the sidebar
        const convos = await Conversation.find({
            participants: { $in: [userId] }
        }).populate("participants", "username profilePic");

        const enhancedConvos = await Promise.all(convos.map(async (convo) => {
            const lastMsg = await Message.findOne({ conversationId: convo._id })
                .sort({ createdAt: -1 });
            
            // Count messages where status is not 'read' and sender isn't the current user
            const unreadCount = await Message.countDocuments({
                conversationId: convo._id,
                sender: { $ne: userId },
                status: { $ne: 'read' }
            });

            return {
                ...convo._doc,
                lastMessage: lastMsg,
                unreadCount: unreadCount
            };
        }));

        // Sort by the most recent message or update time
        res.status(200).json(enhancedConvos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    } catch (err) {
        res.status(500).json({ message: "Error fetching conversations", error: err });
    }
});

// GET MESSAGES FOR A CHAT
router.get("/:conversationId", async (req, res) => {
    try {
        if (!isDbReady()) {
            return res.status(200).json(memoryMessages.filter(message => message.contactId === req.params.conversationId));
        }

        const messages = await Message.find({ conversationId: req.params.conversationId });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

// SEND MESSAGE
router.post("/send", async (req, res) => {
    try {
        if (!isDbReady()) {
            const message = {
                id: `memory-${Date.now()}`,
                ...req.body,
                status: "delivered",
                createdAt: new Date()
            };
            memoryMessages.push(message);
            return res.status(200).json(message);
        }

        const newMessage = new Message(req.body);
        const savedMessage = await newMessage.save();
        // Update the conversation timestamp for sorting
        await Conversation.findByIdAndUpdate(req.body.conversationId, { updatedAt: Date.now() });
        res.status(200).json(savedMessage);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
