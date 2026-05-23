const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const generateToken = require('../utils/generateToken');

const fallbackUsersPath = path.join(__dirname, '..', 'data', 'fallback-users.json');
const ensureFallbackDir = () => fs.mkdirSync(path.dirname(fallbackUsersPath), { recursive: true });
const readFallbackUsers = () => {
    try {
        ensureFallbackDir();
        return JSON.parse(fs.readFileSync(fallbackUsersPath, 'utf8'));
    } catch (error) {
        return [];
    }
};
const writeFallbackUsers = (users) => {
    ensureFallbackDir();
    fs.writeFileSync(fallbackUsersPath, JSON.stringify(users, null, 2));
};

const isDbReady = () => mongoose.connection.readyState === 1;

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!isDbReady()) {
            const users = readFallbackUsers();
            const normalizedEmail = email.trim().toLowerCase();
            const existing = users.find(user => user.email === normalizedEmail);
            if (existing) return res.status(400).json({ message: "User exists" });
            const user = {
                _id: `memory-user-${Date.now()}`,
                username: username.trim(),
                email: normalizedEmail,
                password,
                bio: "",
                profilePic: ""
            };
            writeFallbackUsers([...users, user]);
            return res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePic: user.profilePic,
                token: generateToken(user._id)
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User exists" });
        const user = await User.create({ username, email, password });
        res.status(201).json({ 
            _id: user._id, 
            username: user.username, 
            email: user.email,
            bio: user.bio,
            profilePic: user.profilePic,
            token: generateToken(user._id)
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!isDbReady()) {
            const users = readFallbackUsers();
            const user = users.find(item => item.email === email.trim().toLowerCase() && item.password === password);
            if (!user) return res.status(401).json({ message: "Invalid credentials" });
            return res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePic: user.profilePic,
                token: generateToken(user._id)
            });
        }

        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({ 
                _id: user._id, 
                username: user.username, 
                email: user.email, 
                bio: user.bio, 
                profilePic: user.profilePic,
                token: generateToken(user._id)
            });
        } else { res.status(401).json({ message: "Invalid credentials" }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateUserProfile = async (req, res) => {
    try {
        if (!isDbReady()) {
            const users = readFallbackUsers();
            const user = users.find(item => item._id === req.body.userId);
            if (!user) return res.status(404).json({ message: "User not found" });
            user.bio = req.body.bio || user.bio;
            writeFallbackUsers(users);
            return res.json({ ...user, password: undefined });
        }

        const user = await User.findById(req.body.userId);
        if (user) {
            user.bio = req.body.bio || user.bio;
            if (req.file) user.profilePic = `/uploads/${req.file.filename}`;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio,
                profilePic: updatedUser.profilePic
            });
        } else { res.status(404).json({ message: "User not found" }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// SEARCH FUNCTION - Make sure this is exported!
exports.searchUsers = async (req, res) => {
    try {
        const currentUserId = req.query.currentUserId;
        const term = (req.query.search || "").trim();
        const lowerTerm = term.toLowerCase();
        const fallbackUsers = readFallbackUsers();
        let mongoUsers = [];

        const keyword = term ? {
            $or: [
                { username: { $regex: term, $options: "i" } },
                { email: { $regex: term, $options: "i" } },
            ],
        } : {};

        if (isDbReady()) {
            mongoUsers = await User.find(keyword)
                .select('_id username email bio profilePic')
                .limit(30)
                .lean();
        }

        const fallbackMatches = fallbackUsers
            .filter(user => !lowerTerm || user.username.toLowerCase().includes(lowerTerm) || user.email.toLowerCase().includes(lowerTerm))
            .map(({ password, ...user }) => user);

        const users = [...mongoUsers, ...fallbackMatches]
            .filter(user => String(user._id) !== String(currentUserId))
            .reduce((acc, user) => {
                const key = String(user._id || user.email);
                if (!acc.has(key)) acc.set(key, user);
                return acc;
            }, new Map());

        res.send(Array.from(users.values()));
    } catch (error) {
        res.status(500).json({ message: "Search failed", error: error.message });
    }
};
