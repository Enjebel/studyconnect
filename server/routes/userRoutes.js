const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

// Matches /api/users/register
router.post('/register', registerUser);

// Matches /api/users/login
router.post('/login', loginUser);

module.exports = router;