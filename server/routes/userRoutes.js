const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserProfile } = require('../controllers/userController');

// Registration and Login
router.post('/register', registerUser);
router.post('/login', loginUser);

// Profile Updates
router.put('/profile', updateUserProfile);

module.exports = router;