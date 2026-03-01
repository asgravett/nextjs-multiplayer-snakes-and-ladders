import { randomBytes } from 'crypto';
import { Socket } from 'socket.io';
import {
  createRoomSchema,
  joinRoomSchema,
  roomIdSchema,
  rejoinRoomSchema,
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
import { GameError, GameErrors } from '@/lib/gameErrors';
import { GAME_CONFIG } from '@/lib/constants';
import { roomManager } from './roomManager';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/socketEvents';
import type { Server } from 'socket.io';

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Error handler with proper typing — only forward expected GameError messages to clients
const handleError = (socket: TypedSocket, error: unknown): void => {
  if (error instanceof GameError) {
    socket.emit('error', { message: error.message });
  } else {
    console.error(`[Socket ${socket.id}] Unexpected error:`, error);
    socket.emit('error', { message: 'An unexpected error occurred' });
  }
};

// Generate unique room ID using cryptographically secure random bytes
const generateRoomId = (): string => {
  return `room_${Date.now()}_${randomBytes(4).toString('hex')}`;
};

export const createHandlers = (io: TypedServer) => {
  const broadcastRoomsList = async (): Promise<void> => {
    io.emit('roomsList', await roomManager.getRoomsInfo());
  };

  // Maximum total rooms to prevent memory exhaustion (env-configurable)
  const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 250;

  // Simple per-socket rate limiter: maxCalls allowed per windowMs
  const makeRateLimiter = (maxCalls: number, windowMs: number) => {
    const buckets = new Map<string, { count: number; resetAt: number }>();
    return (socketId: string): boolean => {
      const now = Date.now();
      const b = buckets.get(socketId);
      if (!b || now >= b.resetAt) {
        buckets.set(socketId, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (b.count >= maxCalls) return false;
      b.count++;
      return true;
    };
  };

  const createRoomLimiter = makeRateLimiter(5, 60_000); // 5 per minute
  const joinRoomLimiter = makeRateLimiter(10, 60_000); // 10 per minute
  const rollDiceLimiter = makeRateLimiter(60, 60_000); // 60 per minute

  // Grace period before a mid-game disconnected player is permanently removed
  const REJOIN_GRACE_MS = 120_000; // 2 minutes
  // keyed by clientId
  const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    handleCreateRoom: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        if (!createRoomLimiter(socket.id)) {
          throw new GameError(
            'Too many requests. Please slow down.',
            'RATE_LIMITED',
          );
        }

        const { roomName, playerName, clientId } = validateSocketData(
          createRoomSchema,
          data,
        );

        const allRooms = await roomManager.getAll();
        if (allRooms.length >= MAX_ROOMS) {
          throw new GameError(
            'Server is at capacity. Try again later.',
            'SERVER_FULL',
          );
        }

        const roomId = generateRoomId();

        socket.join(roomId);
        await roomManager.create(roomId, roomName, socket.id);
        await roomManager.addPlayer(roomId, socket.id, playerName, clientId);

        const room = await roomManager.get(roomId);
        socket.emit('roomJoined', { roomId, room: room! });
        await broadcastRoomsList();

        console.log(`[Room ${roomId}] Created by ${playerName} (${socket.id})`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleJoinRoom: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        if (!joinRoomLimiter(socket.id)) {
          throw new GameError(
            'Too many requests. Please slow down.',
            'RATE_LIMITED',
          );
        }

        const { roomId, playerName, clientId } = validateSocketData(
          joinRoomSchema,
          data,
        );
        const room = await roomManager.get(roomId);

        validateRoomExists(room, roomId);
        validateRoomNotFull(
          Object.keys(room!.gameState.players).length,
          room!.maxPlayers,
        );

        if (room!.gameState.gameStarted) {
          throw GameErrors.GAME_ALREADY_STARTED();
        }

        socket.join(roomId);
        await roomManager.addPlayer(roomId, socket.id, playerName, clientId);

        const updatedRoom = (await roomManager.get(roomId))!;
        socket.emit('roomJoined', { roomId, room: updatedRoom });
        io.to(roomId).emit('gameState', updatedRoom.gameState);
        await broadcastRoomsList();

        console.log(`[Room ${roomId}] ${playerName} (${socket.id}) joined`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleStartGame: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = await roomManager.get(roomId);

        validateRoomExists(room, roomId);
        validateIsHost(room!.host, socket.id);
        validateMinimumPlayers(Object.keys(room!.gameState.players).length);

        if (room!.gameState.gameStarted) {
          throw GameErrors.GAME_ALREADY_STARTED();
        }

        room!.gameState.gameStarted = true;
        room!.gameState.currentTurn = room!.gameState.playerOrder[0];
        await roomManager.save(room!);

        io.to(roomId).emit('gameState', room!.gameState);
        await broadcastRoomsList();

        console.log(`[Room ${roomId}] Game started`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleRollDice: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        if (!rollDiceLimiter(socket.id)) {
          throw new GameError(
            'Too many requests. Please slow down.',
            'RATE_LIMITED',
          );
        }

        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = await roomManager.get(roomId);

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
          io.to(roomId).emit('gameWon', {
            winner: room!.gameState.players[socket.id].name,
          });
          console.log(
            `[Room ${roomId}] ${room!.gameState.players[socket.id].name} won!`,
          );
        } else {
          room!.gameState.currentTurn = roomManager.getNextTurn(
            room!.gameState,
          );
        }

        await roomManager.save(room!);

        io.to(roomId).emit('gameState', room!.gameState);
        io.to(roomId).emit('diceRolled', {
          playerId: socket.id,
          roll,
          newPosition,
        });
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleResetGame: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = await roomManager.get(roomId);

        validateRoomExists(room, roomId);
        validateIsHost(room!.host, socket.id);

        // Reset all player positions
        Object.keys(room!.gameState.players).forEach((id) => {
          room!.gameState.players[id].position = GAME_CONFIG.STARTING_POSITION;
        });
        room!.gameState.winner = null;
        room!.gameState.currentTurn = room!.gameState.playerOrder[0];
        room!.gameState.gameStarted = true;
        await roomManager.save(room!);

        io.to(roomId).emit('gameState', room!.gameState);
        io.to(roomId).emit('gameReset');

        console.log(`[Room ${roomId}] Game reset`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleLeaveRoom: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = await roomManager.get(roomId);

        if (room) {
          socket.leave(roomId);
          delete room.gameState.players[socket.id];
          room.gameState.playerOrder = room.gameState.playerOrder.filter(
            (id) => id !== socket.id,
          );

          // If the leaving player was holding the turn, advance to the next player
          if (room.gameState.currentTurn === socket.id) {
            room.gameState.currentTurn = room.gameState.playerOrder[0] ?? null;
          }

          // Notify the leaving player
          socket.emit('roomLeft');

          // If room is empty, delete it
          if (Object.keys(room.gameState.players).length === 0) {
            await roomManager.delete(roomId);
          } else {
            // Assign new host if needed
            if (room.host === socket.id) {
              room.host = room.gameState.playerOrder[0];
              io.to(roomId).emit('hostChanged', { newHostId: room.host });
            }

            await roomManager.save(room);

            // Update remaining players
            io.to(roomId).emit('gameState', room.gameState);
          }

          // Update room list for everyone
          await broadcastRoomsList();

          console.log(`Player ${socket.id} left room ${roomId}`);
        }
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleRejoinRoom: async (
      socket: TypedSocket,
      data: unknown,
    ): Promise<void> => {
      try {
        const { roomId, clientId } = validateSocketData(rejoinRoomSchema, data);
        const room = await roomManager.get(roomId);

        if (!room) {
          socket.emit('rejoinFailed', { reason: 'Room no longer exists' });
          return;
        }

        const player = await roomManager.findPlayerByClientId(roomId, clientId);
        if (!player || !player.disconnected) {
          socket.emit('rejoinFailed', {
            reason: 'No disconnected session found in this room',
          });
          return;
        }

        const oldSocketId = player.id;

        // Cancel the eviction timer
        const timer = disconnectTimers.get(clientId);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.delete(clientId);
        }

        // Re-bind the player to their new socket ID
        await roomManager.reconnectPlayer(roomId, oldSocketId, socket.id);

        socket.join(roomId);

        const updatedRoom = (await roomManager.get(roomId))!;
        socket.emit('roomJoined', { roomId, room: updatedRoom });
        io.to(roomId).emit('gameState', updatedRoom.gameState);
        await broadcastRoomsList();

        console.log(
          `[Room ${roomId}] Player ${socket.id} rejoined (was ${oldSocketId})`,
        );
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleDisconnect: async (socket: TypedSocket): Promise<void> => {
      const room = await roomManager.findPlayerRoom(socket.id);

      if (room) {
        const player = room.gameState.players[socket.id];
        const wasHost = room.host === socket.id;
        const isMidGame = room.gameState.gameStarted && !room.gameState.winner;

        if (isMidGame && player) {
          // Keep the slot — mark as disconnected so turn logic skips them
          await roomManager.markPlayerDisconnected(room.id, socket.id);

          // Re-fetch room after the write
          const updatedRoom = (await roomManager.get(room.id))!;

          // Skip their turn if the game is waiting on them
          if (updatedRoom.gameState.currentTurn === socket.id) {
            updatedRoom.gameState.currentTurn = roomManager.getNextActiveTurn(
              updatedRoom.gameState,
              socket.id,
            );
            await roomManager.save(updatedRoom);
          }

          // Transfer host to a connected player
          if (wasHost) {
            const nextActive = updatedRoom.gameState.playerOrder.find(
              (id) =>
                id !== socket.id &&
                !updatedRoom.gameState.players[id]?.disconnected,
            );
            if (nextActive) {
              updatedRoom.host = nextActive;
              await roomManager.save(updatedRoom);
              io.to(room.id).emit('hostChanged', { newHostId: nextActive });
            }
          }

          io.to(room.id).emit('gameState', updatedRoom.gameState);

          // Schedule permanent eviction after the grace period
          const existing = disconnectTimers.get(player.clientId);
          if (existing) clearTimeout(existing);

          const timer = setTimeout(async () => {
            disconnectTimers.delete(player.clientId);
            const currentRoom = await roomManager.get(room.id);
            if (!currentRoom) return;

            // Find the player by clientId — their socketId may have changed if they rejoined
            const currentPlayer = await roomManager.findPlayerByClientId(
              room.id,
              player.clientId,
            );
            if (!currentPlayer || !currentPlayer.disconnected) return; // Already rejoined

            const roomDeleted = await roomManager.removePlayer(
              room.id,
              currentPlayer.id,
            );
            if (!roomDeleted) {
              const freshRoom = await roomManager.get(room.id);
              if (freshRoom) {
                io.to(room.id).emit('gameState', freshRoom.gameState);
              }
            }
            await broadcastRoomsList();
            console.log(
              `[Room ${room.id}] Player ${currentPlayer.id} evicted after grace period`,
            );
          }, REJOIN_GRACE_MS);

          disconnectTimers.set(player.clientId, timer);
        } else {
          // Pre-game or game over: remove immediately (existing behaviour)
          const roomDeleted = await roomManager.removePlayer(
            room.id,
            socket.id,
          );
          if (!roomDeleted) {
            const updatedRoom = (await roomManager.get(room.id))!;
            if (wasHost) {
              io.to(room.id).emit('hostChanged', {
                newHostId: updatedRoom.host,
              });
            }
            io.to(room.id).emit('gameState', updatedRoom.gameState);
          }
        }

        await broadcastRoomsList();
        console.log(`[Room ${room.id}] Player ${socket.id} disconnected`);
      }

      console.log(`Player disconnected: ${socket.id}`);
    },

    broadcastRoomsList,
  };
};
