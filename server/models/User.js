const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, "Username is required"], 
        unique: true 
    },
    email: { 
        type: String, 
        required: [true, "Email is required"], 
        unique: true,
        match: [/.+\@.+\..+/, "Please fill a valid email address"]
    },
    password: { 
        type: String, 
        required: [true, "Password is required"] 
    },
}, { timestamps: true });

/**
 * PASSWORD HASHING MIDDLEWARE
 * Modern Mongoose uses async/await without the 'next' callback.
 * This runs automatically before user.save() or User.create()
 */
userSchema.pre('save', async function () {
    // Only hash the password if it's new or being updated
    if (!this.isModified('password')) {
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        console.error("Bcrypt Hashing Error:", err);
        throw new Error("Password encryption failed");
    }
});

/**
 * METHOD TO COMPARE PASSWORDS
 * Used in the login controller
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);