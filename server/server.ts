import { createServer } from 'http';
import { Server } from 'socket.io';
import { moveSchema } from '../lib/validation';
import { applyRoll } from '../lib/logic';

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

type Player = { id: string; position: number; name: string };
type GameState = {
  players: Record<string, Player>;
  currentTurn: string | null;
  playerOrder: string[];
  winner: string | null;
  gameStarted: boolean;
};

type Room = {
  id: string;
  name: string;
  host: string;
  gameState: GameState;
  maxPlayers: number;
};

const rooms = new Map<string, Room>();

function createRoom(roomId: string, roomName: string, hostId: string): Room {
  const room: Room = {
    id: roomId,
    name: roomName,
    host: hostId,
    maxPlayers: 4,
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
}

function getNextTurn(gameState: GameState): string | null {
  if (gameState.playerOrder.length === 0) return null;
  const currentIndex = gameState.playerOrder.indexOf(
    gameState.currentTurn || ''
  );
  const nextIndex = (currentIndex + 1) % gameState.playerOrder.length;
  return gameState.playerOrder[nextIndex];
}

function startGame(room: Room) {
  if (room.gameState.playerOrder.length > 0 && !room.gameState.gameStarted) {
    room.gameState.gameStarted = true;
    room.gameState.currentTurn = room.gameState.playerOrder[0];
    io.to(room.id).emit('gameState', room.gameState);
  }
}

io.on('connection', (socket) => {
  console.log('Player connected', socket.id);

  // Send available rooms
  socket.emit(
    'roomsList',
    Array.from(rooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      playerCount: Object.keys(r.gameState.players).length,
      maxPlayers: r.maxPlayers,
      gameStarted: r.gameState.gameStarted,
    }))
  );

  socket.on('createRoom', (data: { roomName: string; playerName: string }) => {
    const roomId = `room_${Date.now()}`;
    const room = createRoom(roomId, data.roomName, socket.id);

    socket.join(roomId);
    room.gameState.players[socket.id] = {
      id: socket.id,
      position: 1,
      name: data.playerName || `Player 1`,
    };
    room.gameState.playerOrder.push(socket.id);

    socket.emit('roomJoined', { roomId, room });
    io.emit(
      'roomsList',
      Array.from(rooms.values()).map((r) => ({
        id: r.id,
        name: r.name,
        playerCount: Object.keys(r.gameState.players).length,
        maxPlayers: r.maxPlayers,
        gameStarted: r.gameState.gameStarted,
      }))
    );
  });

  socket.on('joinRoom', (data: { roomId: string; playerName: string }) => {
    const room = rooms.get(data.roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (Object.keys(room.gameState.players).length >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (room.gameState.gameStarted) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    socket.join(data.roomId);
    const playerNumber = Object.keys(room.gameState.players).length + 1;
    room.gameState.players[socket.id] = {
      id: socket.id,
      position: 1,
      name: data.playerName || `Player ${playerNumber}`,
    };
    room.gameState.playerOrder.push(socket.id);

    socket.emit('roomJoined', { roomId: data.roomId, room });
    io.to(data.roomId).emit('gameState', room.gameState);
    io.emit(
      'roomsList',
      Array.from(rooms.values()).map((r) => ({
        id: r.id,
        name: r.name,
        playerCount: Object.keys(r.gameState.players).length,
        maxPlayers: r.maxPlayers,
        gameStarted: r.gameState.gameStarted,
      }))
    );
  });

  socket.on('startGame', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }

    if (Object.keys(room.gameState.players).length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    startGame(room);
  });

  socket.on('rollDice', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    if (room.gameState.currentTurn !== socket.id) {
      socket.emit('error', { message: 'Not your turn!' });
      return;
    }

    if (room.gameState.winner) {
      socket.emit('error', { message: 'Game is over!' });
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    const currentPosition = room.gameState.players[socket.id].position;
    const newPosition = applyRoll(currentPosition, roll);

    room.gameState.players[socket.id].position = newPosition;

    if (newPosition >= 100) {
      room.gameState.winner = socket.id;
      io.to(room.id).emit('gameWon', {
        winner: room.gameState.players[socket.id].name,
        winnerId: socket.id,
      });
    } else {
      room.gameState.currentTurn = getNextTurn(room.gameState);
    }

    io.to(room.id).emit('gameState', room.gameState);
    io.to(room.id).emit('diceRolled', {
      playerId: socket.id,
      roll,
      newPosition,
    });
  });

  socket.on('resetGame', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    if (room.host !== socket.id) {
      socket.emit('error', { message: 'Only host can reset the game' });
      return;
    }

    Object.keys(room.gameState.players).forEach((id) => {
      room.gameState.players[id].position = 1;
    });
    room.gameState.winner = null;
    room.gameState.currentTurn = room.gameState.playerOrder[0];
    room.gameState.gameStarted = true;

    io.to(room.id).emit('gameState', room.gameState);
    io.to(room.id).emit('gameReset', {});
  });

  socket.on('leaveRoom', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    socket.leave(data.roomId);
    delete room.gameState.players[socket.id];
    room.gameState.playerOrder = room.gameState.playerOrder.filter(
      (id) => id !== socket.id
    );

    if (room.gameState.currentTurn === socket.id) {
      room.gameState.currentTurn = getNextTurn(room.gameState);
    }

    // Delete room if empty
    if (Object.keys(room.gameState.players).length === 0) {
      rooms.delete(data.roomId);
    } else {
      // Transfer host if needed
      if (room.host === socket.id) {
        room.host = room.gameState.playerOrder[0];
      }
      io.to(room.id).emit('gameState', room.gameState);
    }

    io.emit(
      'roomsList',
      Array.from(rooms.values()).map((r) => ({
        id: r.id,
        name: r.name,
        playerCount: Object.keys(r.gameState.players).length,
        maxPlayers: r.maxPlayers,
        gameStarted: r.gameState.gameStarted,
      }))
    );
  });

  socket.on('disconnect', () => {
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

    io.emit(
      'roomsList',
      Array.from(rooms.values()).map((r) => ({
        id: r.id,
        name: r.name,
        playerCount: Object.keys(r.gameState.players).length,
        maxPlayers: r.maxPlayers,
        gameStarted: r.gameState.gameStarted,
      }))
    );
  });
});

httpServer.listen(4000, () =>
  console.log('Socket server running on http://localhost:4000')
);
