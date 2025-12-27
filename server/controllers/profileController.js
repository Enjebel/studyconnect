const User = require('../models/User');

// Update user profile (bio, profile picture)
exports.updateProfile = async (req, res) => {
    try {
        const { bio } = req.body;
        const updateData = {};
        
        if (bio) updateData.bio = bio;
        
        // If a file was uploaded via Multer
        if (req.file) {
            updateData.profilePic = `/uploads/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get profile info for a specific user
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};