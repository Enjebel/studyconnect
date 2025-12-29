const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
    console.log("Checkpoint 1: Controller reached");
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            console.log("Checkpoint 2: Missing fields");
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log("Checkpoint 3: Checking database for existing user...");
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log("Checkpoint 4: User already exists");
            return res.status(400).json({ message: "User already exists" });
        }

        console.log("Checkpoint 5: Attempting to save to MongoDB...");
        const user = await User.create({ username, email, password });

        console.log("Checkpoint 6: User saved. Generating token...");
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log("Checkpoint 7: Success!");
        res.status(201).json({
            token,
            _id: user._id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error("CRITICAL CONTROLLER ERROR:", error.message);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

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
        res.status(500).json({ message: error.message });
    }
};