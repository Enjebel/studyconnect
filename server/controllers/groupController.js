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

// Update Group Settings (Privacy, Description, etc.)
exports.updateGroupSettings = async (req, res) => {
    try {
        const { groupId } = req.params;
        const updates = req.body; // e.g., { privacy: 'private', description: 'New desc' }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Security: Only Admin can change settings
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the admin can change settings" });
        }

        const updatedGroup = await Group.findByIdAndUpdate(groupId, updates, { new: true });
        res.status(200).json(updatedGroup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove a Member (Admin Only)
exports.removeMember = async (req, res) => {
    try {
        const { groupId, userIdToRemove } = req.body;
        const group = await Group.findById(groupId);

        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        group.members = group.members.filter(id => id.toString() !== userIdToRemove);
        await group.save();
        
        res.status(200).json({ message: "Member removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};