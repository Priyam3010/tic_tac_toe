const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    let room = rooms.get(roomId);
    
    if (!room) {
      room = { players: [], board: Array(9).fill(null), currentPlayer: 'X' };
      rooms.set(roomId, room);
    }

    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    const playerMark = room.players.length === 0 ? 'X' : 'O';
    room.players.push({ id: socket.id, mark: playerMark });
    
    socket.join(roomId);
    socket.emit('playerJoined', { mark: playerMark, board: room.board, currentPlayer: room.currentPlayer });
    
    if (room.players.length === 2) {
      io.to(roomId).emit('gameStart', { players: room.players });
    }
  });

  socket.on('makeMove', ({ roomId, index, mark }) => {
    const room = rooms.get(roomId);
    if (room && room.board[index] === null && room.currentPlayer === mark) {
      room.board[index] = mark;
      room.currentPlayer = mark === 'X' ? 'O' : 'X';
      io.to(roomId).emit('moveMade', { board: room.board, currentPlayer: room.currentPlayer });
    }
  });

  socket.on('restartGame', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.board = Array(9).fill(null);
      room.currentPlayer = 'X';
      io.to(roomId).emit('gameRestarted', { board: room.board, currentPlayer: room.currentPlayer });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Cleanup rooms if needed (optional for this simple implementation)
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
