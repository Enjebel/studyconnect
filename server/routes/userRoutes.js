const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/userController');

// Path: /api/users/register
router.post('/register', registerUser);

module.exports = router;