const express = require('express');
const router = express.Router();
const { updateProfile, getProfile } = require('../controllers/profileController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Route to get any user's profile
router.get('/:userId', auth, getProfile);

// Route to update logged-in user's profile (handles image upload)
router.put('/update', auth, upload.single('profilePic'), updateProfile);

module.exports = router;