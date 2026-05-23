const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.warn('MONGO_URI/MONGODB_URI is not set. API server started without a database connection.');
        return;
    }

    try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;
