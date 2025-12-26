const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    res.send('StudyConnect API is running on dev-branch');
});

// Database & Server Start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("ERROR: MONGODB_URI is not defined in .env file");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log("MongoDB Connected Successfully");
            app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        })
        .catch(err => console.log("Database Connection Error:", err));
}


//  (previous imports)
const userRoutes = require('./routes/userRoutes');

// Use Routes
app.use('/api/users', userRoutes);
