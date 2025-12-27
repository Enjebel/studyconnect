const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Add this

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'student' }
}, { timestamps: true });

// Middleware: This runs automatically BEFORE saving a user
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    // Generate a "salt" (extra security) and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);
