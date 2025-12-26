const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // We will hash this later!
    role: { type: String, default: 'student' } // student, tutor, or admin
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);