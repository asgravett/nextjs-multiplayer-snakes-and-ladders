import { createServer } from 'http';
import { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/socketEvents';
import { createHandlers } from './handlers';
import { roomManager } from './roomManager';

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const httpServer = createServer();

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

const handlers = createHandlers(io);

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Send current rooms list on connect
  socket.emit('roomsList', roomManager.getRoomsInfo());

  // Register event handlers
  socket.on('createRoom', (data) => handlers.handleCreateRoom(socket, data));
  socket.on('joinRoom', (data) => handlers.handleJoinRoom(socket, data));
  socket.on('startGame', (data) => handlers.handleStartGame(socket, data));
  socket.on('rollDice', (data) => handlers.handleRollDice(socket, data));
  socket.on('resetGame', (data) => handlers.handleResetGame(socket, data));
  socket.on('leaveRoom', (data) => handlers.handleLeaveRoom(socket, data));
  socket.on('disconnect', () => handlers.handleDisconnect(socket));
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Socket server running on port ${PORT}`);
});
