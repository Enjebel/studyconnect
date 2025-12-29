const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("Registration attempt for:", email); // Log the attempt

        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Create user
        user = new User({ username, email, password });
        await user.save();

        // 3. Generate Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log("User registered successfully!");
        res.status(201).json({
            token,
            _id: user._id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        // THIS LINE IS KEY: It will print the exact error in your terminal
        console.error("DETAILED REGISTER ERROR:", error); 
        res.status(500).json({ message: error.message });
    }
};

// Login Logic
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, _id: user._id, username: user.username, email: user.email });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};