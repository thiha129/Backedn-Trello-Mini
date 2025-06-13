require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { setIO } = require('./utils/socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Mini Trello Backend is running!');
});

// Import routes
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const cardRoutes = require('./routes/cards');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const inviteRoutes = require('./routes/invite');
const assignRoutes = require('./routes/assign');
const githubRoutes = require('./routes/github');

// Mount routes
app.use('/auth', authRoutes);
app.use('/boards', boardRoutes);
app.use('/boards/:boardId/cards', cardRoutes);
app.use('/boards/:boardId/cards/:id/tasks', taskRoutes);
app.use('/users', userRoutes);
app.use('/boards/:boardId/invite', inviteRoutes);
app.use('/boards/:boardId/cards/:id/tasks/:taskId/assign', assignRoutes);
app.use('/github', githubRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

setIO(io);

// TODO: Socket.io logic ở đây
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // Cho phép join room theo boardId
  socket.on('joinBoard', (boardId) => {
    socket.join(boardId);
    console.log(`Socket ${socket.id} joined board ${boardId}`);
  });
  socket.on('leaveBoard', (boardId) => {
    socket.leave(boardId);
    console.log(`Socket ${socket.id} left board ${boardId}`);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
}); 