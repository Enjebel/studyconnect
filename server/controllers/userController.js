const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a new user
 */
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = await User.create({ username, email, password });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: token,
        });
    } catch (error) {
        res.status(500).json({ message: "Registration Error", detail: error.message });
    }
};

/**
 * @desc    Authenticate user & get token
 */
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: token,
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "Login Error", detail: error.message });
    }
};

/**
 * @desc    Update user profile (Added for Profile Page)
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.bio = req.body.bio || user.bio; 

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Profile Update Error", detail: error.message });
    }
};