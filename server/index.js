const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));