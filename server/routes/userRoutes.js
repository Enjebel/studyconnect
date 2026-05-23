const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { registerUser, loginUser, updateUserProfile, searchUsers } = require('../controllers/userController');

const storage = multer.diskStorage({
    destination(req, file, cb) { cb(null, 'uploads/'); },
    filename(req, file, cb) {
        cb(null, `user-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', searchUsers); // This must be exactly like this
router.put('/profile', upload.single('profilePic'), updateUserProfile);

module.exports = router;