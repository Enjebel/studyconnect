const Group = require('../models/Group');

// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const { name, subject, description, privacy } = req.body;
        const newGroup = new Group({
            name,
            subject,
            description,
            privacy: privacy || 'public',
            admin: req.user.id,
            members: [req.user.id]
        });
        await newGroup.save();
        res.status(201).json(newGroup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Join a group (Logic for Public/Private)
exports.joinGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (group.members.includes(req.user.id)) {
            return res.status(400).json({ message: "Already a member" });
        }

        if (group.privacy === 'public') {
            group.members.push(req.user.id);
            await group.save();
            return res.status(200).json({ message: "Joined successfully" });
        } else {
            if (group.requests.includes(req.user.id)) {
                return res.status(400).json({ message: "Request already pending" });
            }
            group.requests.push(req.user.id);
            await group.save();
            return res.status(200).json({ message: "Request sent to admin" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update group settings (The function that was causing the error)
exports.updateGroupSettings = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.groupId,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedGroup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept a member request
exports.acceptMember = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const group = await Group.findById(groupId);

        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        group.requests = group.requests.filter(id => id.toString() !== userId);
        group.members.push(userId);
        await group.save();
        res.status(200).json({ message: "Member accepted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all groups
exports.getGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('admin', 'username');
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};