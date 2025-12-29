const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
connectDB();

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json()); // CRITICAL: This allows the server to read JSON bodies

// Global Logging Middleware (to see every request)
app.use((req, res, next) => {
    console.log(`Incoming: ${req.method} ${req.url}`);
    console.log("Body:", req.body); // This will show us if data is actually arriving
    next();
});

// ROUTES
app.use('/api/users', userRoutes);

// Basic Home Route
app.get('/', (req, res) => {
    res.send("StudyConnect API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));