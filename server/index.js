require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const profileRoutes = require('./routes/profileRoutes');
const searchRoutes = require('./routes/searchRoutes');
const timetableRoutes = require('./routes/timetableRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Connect to MongoDB Atlas
connectDB();

app.use(cors());
app.use(express.json());

// Static folder for profile pictures
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/timetable', timetableRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'studyconnect-api' });
});

const PORT = process.env.PORT || 5000;
io.on('connection', (socket) => {
    socket.on('call:join', ({ roomId, mode }) => {
        socket.join(roomId);
        socket.to(roomId).emit('call:user-joined', { socketId: socket.id, mode });
    });

    socket.on('call:offer', ({ roomId, offer }) => {
        socket.to(roomId).emit('call:offer', { offer, from: socket.id });
    });

    socket.on('call:answer', ({ roomId, answer }) => {
        socket.to(roomId).emit('call:answer', { answer, from: socket.id });
    });

    socket.on('call:ice-candidate', ({ roomId, candidate }) => {
        socket.to(roomId).emit('call:ice-candidate', { candidate, from: socket.id });
    });

    socket.on('call:end', ({ roomId }) => {
        socket.to(roomId).emit('call:end');
        socket.leave(roomId);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
