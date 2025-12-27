const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/messageController');
const { startPrivateChat, getUserChats } = require('../controllers/chatController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Conversation Routes
router.post('/conversation', auth, startPrivateChat);
router.get('/conversations', auth, getUserChats);

// Message Routes
router.post('/send', auth, upload.single('file'), sendMessage);
router.get('/:conversationId', auth, getMessages);

module.exports = router;