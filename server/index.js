const express = require('express');
const mongoose = require('mongoose') // added you missed this out 
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const timetableController = require('./routes/timetableRoutes')

// Load Env and Connect DB
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));

// Socket Logic
io.on('connection', (socket) => {
    socket.on('user_online', async (userId) => {
        socket.userId = userId;
        const User = require('./models/User');
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit('status_change', { userId, isOnline: true });
    });

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
    });

    socket.on('send_message', (data) => {
        io.to(data.conversationId).emit('receive_message', data);
    });

    socket.on('disconnect', async () => {
        if (socket.userId) {
            const User = require('./models/User');
            await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
            io.emit('status_change', { userId: socket.userId, isOnline: false });
        }
    });
});

// Custom Error Middleware
app.use(errorHandler);

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


const groupRoutes = require('./routes/groupRoutes');

// ... other app.use statements
app.use('/api/groups', groupRoutes);
app.use('/api/groups' , timetableController)