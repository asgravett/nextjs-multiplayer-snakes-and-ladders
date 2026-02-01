import { Socket } from 'socket.io';
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
import { GameErrors } from '@/lib/gameErrors';
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

// Error handler with proper typing
const handleError = (socket: TypedSocket, error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const code =
    error instanceof Error && 'code' in error
      ? (error as { code: string }).code
      : 'UNKNOWN_ERROR';

  console.error(`[Socket ${socket.id}] Error:`, message);
  socket.emit('error', { message, code });
};

// Generate unique room ID
const generateRoomId = (): string => {
  return `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

export const createHandlers = (io: TypedServer) => {
  const broadcastRoomsList = (): void => {
    io.emit('roomsList', roomManager.getRoomsInfo());
  };

  return {
    handleCreateRoom: (socket: TypedSocket, data: unknown): void => {
      try {
        const { roomName, playerName } = validateSocketData(
          createRoomSchema,
          data,
        );

        const roomId = generateRoomId();
        const room = roomManager.create(roomId, roomName, socket.id);

        socket.join(roomId);
        roomManager.addPlayer(roomId, socket.id, playerName);

        socket.emit('roomJoined', { roomId, room: roomManager.get(roomId)! });
        broadcastRoomsList();

        console.log(`[Room ${roomId}] Created by ${playerName} (${socket.id})`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleJoinRoom: (socket: TypedSocket, data: unknown): void => {
      try {
        const { roomId, playerName } = validateSocketData(joinRoomSchema, data);
        const room = roomManager.get(roomId);

        validateRoomExists(room, roomId);
        validateRoomNotFull(
          Object.keys(room!.gameState.players).length,
          room!.maxPlayers,
        );

        if (room!.gameState.gameStarted) {
          throw GameErrors.GAME_ALREADY_STARTED();
        }

        socket.join(roomId);
        roomManager.addPlayer(roomId, socket.id, playerName);

        const updatedRoom = roomManager.get(roomId)!;
        socket.emit('roomJoined', { roomId, room: updatedRoom });
        io.to(roomId).emit('gameState', updatedRoom.gameState);
        broadcastRoomsList();

        console.log(`[Room ${roomId}] ${playerName} (${socket.id}) joined`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleStartGame: (socket: TypedSocket, data: unknown): void => {
      try {
        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = roomManager.get(roomId);

        validateRoomExists(room, roomId);
        validateIsHost(room!.host, socket.id);
        validateMinimumPlayers(Object.keys(room!.gameState.players).length);

        if (room!.gameState.gameStarted) {
          throw GameErrors.GAME_ALREADY_STARTED();
        }

        room!.gameState.gameStarted = true;
        room!.gameState.currentTurn = room!.gameState.playerOrder[0];

        io.to(roomId).emit('gameState', room!.gameState);
        broadcastRoomsList();

        console.log(`[Room ${roomId}] Game started`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleRollDice: (socket: TypedSocket, data: unknown): void => {
      try {
        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = roomManager.get(roomId);

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
            winnerId: socket.id,
          });
          console.log(
            `[Room ${roomId}] ${room!.gameState.players[socket.id].name} won!`,
          );
        } else {
          room!.gameState.currentTurn = roomManager.getNextTurn(
            room!.gameState,
          );
        }

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

    handleResetGame: (socket: TypedSocket, data: unknown): void => {
      try {
        const { roomId } = validateSocketData(roomIdSchema, data);
        const room = roomManager.get(roomId);

        validateRoomExists(room, roomId);
        validateIsHost(room!.host, socket.id);

        // Reset all player positions
        Object.keys(room!.gameState.players).forEach((id) => {
          room!.gameState.players[id].position = GAME_CONFIG.STARTING_POSITION;
        });
        room!.gameState.winner = null;
        room!.gameState.currentTurn = room!.gameState.playerOrder[0];
        room!.gameState.gameStarted = true;

        io.to(roomId).emit('gameState', room!.gameState);
        io.to(roomId).emit('gameReset', {});

        console.log(`[Room ${roomId}] Game reset`);
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleLeaveRoom: (socket: TypedSocket, data: unknown): void => {
      try {
        const { roomId } = validateSocketData(leaveRoomPayloadSchema, data);
        const room = roomManager.get(roomId);

        if (room) {
          const player = room.gameState.players[socket.id];
          const playerName = player?.name || 'Unknown';

          socket.leave(roomId);
          delete room.gameState.players[socket.id];
          room.gameState.playerOrder = room.gameState.playerOrder.filter(
            (id) => id !== socket.id,
          );

          // Notify the leaving player
          socket.emit('roomLeft');

          // If room is empty, delete it
          if (Object.keys(room.gameState.players).length === 0) {
            roomManager.delete(roomId);
          } else {
            // Assign new host if needed
            if (room.host === socket.id) {
              room.host = room.gameState.playerOrder[0];
            }

            // Update remaining players
            io.to(roomId).emit('gameState', room.gameState);

            // Notify remaining players (optional: system message)
            io.to(roomId).emit('systemMessage', {
              message: `${playerName} left the room`,
              timestamp: Date.now(),
            });
          }

          // Update room list for everyone
          io.emit('roomsList', getRoomsList());

          console.log(`Player ${socket.id} left room ${roomId}`);
        }
      } catch (error) {
        handleError(socket, error);
      }
    },

    handleDisconnect: (socket: TypedSocket): void => {
      const room = roomManager.findPlayerRoom(socket.id);

      if (room) {
        const roomDeleted = roomManager.removePlayer(room.id, socket.id);

        if (!roomDeleted) {
          io.to(room.id).emit('gameState', roomManager.get(room.id)!.gameState);
        }

        broadcastRoomsList();
        console.log(`[Room ${room.id}] Player ${socket.id} disconnected`);
      }

      console.log(`Player disconnected: ${socket.id}`);
    },

    broadcastRoomsList,
  };
};
