const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String },
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Links to the User model
        required: true 
    },
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);