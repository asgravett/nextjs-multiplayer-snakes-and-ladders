import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import {
  createRoomSchema,
  joinRoomSchema,
  roomIdSchema,
  validateSocketData,
  validateRoomExists,
  validateGameStarted,
  validateGameNotOver,
  validatePlayerTurn,
  validateIsHost,
  validateRoomNotFull,
  validateMinimumPlayers,
} from '@/lib/validation';
import { applyRoll, rollDice } from '@/lib/logic';
import { GameState, Room } from '@/lib/types';
import { GameErrors } from '@/lib/gameErrors';
import { GAME_CONFIG } from '@/lib/constants';

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });
const rooms = new Map<string, Room>();

// Helper functions remain the same...
const createRoom = (roomId: string, roomName: string, hostId: string): Room => {
  const room: Room = {
    id: roomId,
    name: roomName,
    host: hostId,
    maxPlayers: GAME_CONFIG.MAX_PLAYERS,
    gameState: {
      players: {},
      currentTurn: null,
      playerOrder: [],
      winner: null,
      gameStarted: false,
    },
  };
  rooms.set(roomId, room);
  return room;
};

const getNextTurn = (gameState: GameState): string | null => {
  if (gameState.playerOrder.length === 0) return null;
  const currentIndex = gameState.playerOrder.indexOf(
    gameState.currentTurn || ''
  );
  const nextIndex = (currentIndex + 1) % gameState.playerOrder.length;
  return gameState.playerOrder[nextIndex];
};

const startGame = (room: Room): void => {
  if (room.gameState.playerOrder.length > 0 && !room.gameState.gameStarted) {
    room.gameState.gameStarted = true;
    room.gameState.currentTurn = room.gameState.playerOrder[0];
    io.to(room.id).emit('gameState', room.gameState);
  }
};

const broadcastRoomsList = (): void => {
  io.emit('roomsList', getRoomsInfo());
};

const getRoomsInfo = () => {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    playerCount: Object.keys(r.gameState.players).length,
    maxPlayers: r.maxPlayers,
    gameStarted: r.gameState.gameStarted,
  }));
};

// Consistent error handler
const handleSocketError = (socket: Socket, error: any) => {
  console.error('Socket error:', error.message);
  socket.emit('error', {
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
  });
};

// ✅ UPDATED HANDLERS - All use consistent validation and error handling
const handleCreateRoom = (socket: Socket, data: unknown): void => {
  try {
    const { roomName, playerName } = validateSocketData(createRoomSchema, data);

    const roomId = `room_${Date.now()}`;
    const room = createRoom(roomId, roomName, socket.id);

    socket.join(roomId);
    room.gameState.players[socket.id] = {
      id: socket.id,
      position: GAME_CONFIG.STARTING_POSITION,
      name: playerName,
    };
    room.gameState.playerOrder.push(socket.id);

    socket.emit('roomJoined', { roomId, room });
    broadcastRoomsList();
  } catch (error) {
    handleSocketError(socket, error);
  }
};

const handleJoinRoom = (socket: Socket, data: unknown): void => {
  try {
    const { roomId, playerName } = validateSocketData(joinRoomSchema, data);
    const room = rooms.get(roomId);

    validateRoomExists(room, roomId);
    validateRoomNotFull(
      Object.keys(room!.gameState.players).length,
      room!.maxPlayers
    );

    if (room!.gameState.gameStarted) {
      throw GameErrors.GAME_ALREADY_STARTED();
    }

    socket.join(roomId);
    room!.gameState.players[socket.id] = {
      id: socket.id,
      position: GAME_CONFIG.STARTING_POSITION,
      name: playerName,
    };
    room!.gameState.playerOrder.push(socket.id);

    socket.emit('roomJoined', { roomId, room });
    io.to(roomId).emit('gameState', room!.gameState);
    broadcastRoomsList();
  } catch (error) {
    handleSocketError(socket, error);
  }
};

const handleStartGame = (socket: Socket, data: unknown): void => {
  try {
    const { roomId } = validateSocketData(roomIdSchema, data);
    const room = rooms.get(roomId);

    validateRoomExists(room, roomId);
    validateIsHost(room!.host, socket.id);
    validateMinimumPlayers(Object.keys(room!.gameState.players).length);

    if (room!.gameState.gameStarted) {
      throw GameErrors.GAME_ALREADY_STARTED();
    }

    startGame(room!);
  } catch (error) {
    handleSocketError(socket, error);
  }
};

const handleRollDice = (socket: Socket, data: unknown): void => {
  try {
    const { roomId } = validateSocketData(roomIdSchema, data);
    const room = rooms.get(roomId);

    validateRoomExists(room, roomId);
    validateGameStarted(room!.gameState.gameStarted);
    validateGameNotOver(room!.gameState.winner);
    validatePlayerTurn(room!.gameState.currentTurn, socket.id);

    const roll = rollDice();
    const currentPosition = room!.gameState.players[socket.id].position;
    const newPosition = applyRoll(currentPosition, roll);

    room!.gameState.players[socket.id].position = newPosition;

    if (newPosition >= GAME_CONFIG.WINNING_POSITION) {
      room!.gameState.winner = socket.id;
      io.to(room!.id).emit('gameWon', {
        winner: room!.gameState.players[socket.id].name,
        winnerId: socket.id,
      });
    } else {
      room!.gameState.currentTurn = getNextTurn(room!.gameState);
    }

    io.to(room!.id).emit('gameState', room!.gameState);
    io.to(room!.id).emit('diceRolled', {
      playerId: socket.id,
      roll,
      newPosition,
    });
  } catch (error) {
    handleSocketError(socket, error);
  }
};

const handleResetGame = (socket: Socket, data: unknown): void => {
  try {
    const { roomId } = validateSocketData(roomIdSchema, data);
    const room = rooms.get(roomId);

    validateRoomExists(room, roomId);
    validateIsHost(room!.host, socket.id);

    Object.keys(room!.gameState.players).forEach((id) => {
      room!.gameState.players[id].position = GAME_CONFIG.STARTING_POSITION;
    });
    room!.gameState.winner = null;
    room!.gameState.currentTurn = room!.gameState.playerOrder[0];
    room!.gameState.gameStarted = true;

    io.to(room!.id).emit('gameState', room!.gameState);
    io.to(room!.id).emit('gameReset', {});
  } catch (error) {
    handleSocketError(socket, error);
  }
};

const handleLeaveRoom = (socket: Socket, data: unknown): void => {
  try {
    const { roomId } = validateSocketData(roomIdSchema, data);
    const room = rooms.get(roomId);

    validateRoomExists(room, roomId);

    socket.leave(roomId);
    delete room!.gameState.players[socket.id];
    room!.gameState.playerOrder = room!.gameState.playerOrder.filter(
      (id) => id !== socket.id
    );

    if (room!.gameState.currentTurn === socket.id) {
      room!.gameState.currentTurn = getNextTurn(room!.gameState);
    }

    // Delete room if empty
    if (Object.keys(room!.gameState.players).length === 0) {
      rooms.delete(roomId);
    } else {
      // Transfer host if needed
      if (room!.host === socket.id) {
        room!.host = room!.gameState.playerOrder[0];
      }
      io.to(room!.id).emit('gameState', room!.gameState);
    }

    broadcastRoomsList();
  } catch (error) {
    handleSocketError(socket, error);
  }
};

const handleDisconnect = (socket: Socket): void => {
  // Find and leave all rooms
  rooms.forEach((room, roomId) => {
    if (room.gameState.players[socket.id]) {
      delete room.gameState.players[socket.id];
      room.gameState.playerOrder = room.gameState.playerOrder.filter(
        (id) => id !== socket.id
      );

      if (room.gameState.currentTurn === socket.id) {
        room.gameState.currentTurn = getNextTurn(room.gameState);
      }

      if (Object.keys(room.gameState.players).length === 0) {
        rooms.delete(roomId);
      } else {
        if (room.host === socket.id) {
          room.host = room.gameState.playerOrder[0];
        }
        io.to(room.id).emit('gameState', room.gameState);
      }
    }
  });

  broadcastRoomsList();
};

io.on('connection', (socket) => {
  console.log('Player connected', socket.id);
  socket.emit('roomsList', getRoomsInfo());

  socket.on('createRoom', (data) => handleCreateRoom(socket, data));
  socket.on('joinRoom', (data) => handleJoinRoom(socket, data));
  socket.on('startGame', (data) => handleStartGame(socket, data));
  socket.on('rollDice', (data) => handleRollDice(socket, data));
  socket.on('resetGame', (data) => handleResetGame(socket, data));
  socket.on('leaveRoom', (data) => handleLeaveRoom(socket, data));
  socket.on('disconnect', () => handleDisconnect(socket));
});

httpServer.listen(4000, () =>
  console.log('Socket server running on http://localhost:4000')
);
