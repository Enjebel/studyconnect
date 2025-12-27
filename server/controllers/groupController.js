const Group = require('../models/Group');

exports.createGroup = async (req, res) => {
    try {
        const { name, subject, description } = req.body;
        
        // req.user.id comes from our Auth Middleware
        const newGroup = new Group({
            name,
            subject,
            description,
            admin: req.user.id,
            members: [req.user.id] // Admin is automatically the first member
        });

        const savedGroup = await newGroup.save();
        res.status(201).json(savedGroup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('admin', 'username');
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};