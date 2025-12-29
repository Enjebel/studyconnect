const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 */
exports.registerUser = async (req, res) => {
    console.log("--- New Registration Request Received ---");
    try {
        const { username, email, password } = req.body;

        // 1. Validation check
        if (!username || !email || !password) {
            console.log("Validation failed: Missing fields");
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        // 2. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log("User already exists:", email);
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // 3. Create and Save User
        // Note: Password hashing is handled automatically in models/User.js via .pre('save')
        console.log("Attempting to save user to MongoDB...");
        const user = await User.create({
            username,
            email,
            password
        });

        if (user) {
            console.log("User saved successfully. ID:", user._id);
            
            // 4. Generate JWT Token
            if (!process.env.JWT_SECRET) {
                console.error("ERROR: JWT_SECRET is missing from your .env file!");
                throw new Error("JWT Configuration Error");
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            });

            // 5. Send Success Response
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: token,
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }

    } catch (error) {
        console.error("--- REGISTER ERROR LOG ---");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        
        // This sends the actual technical error to the frontend alert box for debugging
        res.status(500).json({ 
            message: "Registration Error", 
            detail: error.message 
        });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 */
exports.loginUser = async (req, res) => {
    console.log("--- Login Request Received ---");
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });

        // 2. Compare passwords (matchPassword is a method defined in User.js model)
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            });

            console.log("Login successful for:", email);
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: token,
            });
        } else {
            console.log("Login failed: Invalid credentials");
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("--- LOGIN ERROR LOG ---");
        console.error(error.message);
        res.status(500).json({ message: "Login Error", detail: error.message });
    }
};