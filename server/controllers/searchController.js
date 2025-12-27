const User = require('../models/User');
const Group = require('../models/Group');

exports.searchAll = async (req, res) => {
    try {
        const { query } = req.query; 
        if (!query) return res.status(400).json({ message: "Search query is empty" });

        // Find users matching the query
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('username profilePic isOnline');

        // Find groups matching the query in name or subject
        const groups = await Group.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { subject: { $regex: query, $options: 'i' } }
            ]
        });

        res.status(200).json({ users, groups });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};