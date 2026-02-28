import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/socketEvents';
import { createHandlers } from './handlers';
import { roomManager } from './roomManager';
import { applyRateLimiting } from './rateLimiter';
import { connectRedis, pubClient, subClient } from './redis';

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const PING_INTERVAL = Number(process.env.PING_INTERVAL) || 30000;
const PING_TIMEOUT = Number(process.env.PING_TIMEOUT) || 25000;

const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  }
});

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
  transports: ['websocket'],
  pingInterval: PING_INTERVAL,
  pingTimeout: PING_TIMEOUT,
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: { level: 6 },
  },
});

async function main() {
  // Connect Redis and attach the pub/sub adapter
  await connectRedis();
  io.adapter(createAdapter(pubClient, subClient));

  applyRateLimiting(io);

  const handlers = createHandlers(io);

  io.on('connection', async (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Send current rooms list on connect
    socket.emit('roomsList', await roomManager.getRoomsInfo());

    // Register event handlers
    socket.on('createRoom', (data) => handlers.handleCreateRoom(socket, data));
    socket.on('joinRoom', (data) => handlers.handleJoinRoom(socket, data));
    socket.on('rejoinRoom', (data) => handlers.handleRejoinRoom(socket, data));
    socket.on('startGame', (data) => handlers.handleStartGame(socket, data));
    socket.on('rollDice', (data) => handlers.handleRollDice(socket, data));
    socket.on('resetGame', (data) => handlers.handleResetGame(socket, data));
    socket.on('leaveRoom', (data) => handlers.handleLeaveRoom(socket, data));
    socket.on('disconnect', () => handlers.handleDisconnect(socket));
  });

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Socket server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received — closing server gracefully');

  // Stop accepting new connections
  io.close(async () => {
    console.log('All Socket.IO connections closed');
    await Promise.all([pubClient.quit(), subClient.quit()]).catch(() => {});
    console.log('Redis connections closed');
    process.exit(0);
  });

  // Force exit after 10s if connections don't close
  setTimeout(() => {
    console.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000);
});
