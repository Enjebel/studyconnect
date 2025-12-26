const User = require('../models/User');
const bcrypt = require('bcryptjs');

// REGISTER Logic
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "User registered safely!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LOGIN Logic
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        res.status(200).json({ message: "Login successful!", username: user.username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};