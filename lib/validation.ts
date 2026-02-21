import { z } from 'zod';
import { GAME_CONFIG } from './constants';
import { GameErrors } from './gameErrors';

export const moveSchema = z.object({
  roll: z.number().int().min(1).max(GAME_CONFIG.DICE_SIDES),
});

export const createRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name too long')
    .trim()
    .refine((val) => val.length > 0, 'Room name cannot be empty'),
  playerName: z
    .string()
    .min(1, 'Player name is required')
    .max(20, 'Player name too long')
    .trim()
    .refine((val) => val.length > 0, 'Player name cannot be empty'),
  clientId: z.string().min(1, 'Client ID is required'),
});

export const joinRoomSchema = z.object({
  roomId: z
    .string()
    .min(1, 'Room ID is required')
    .refine((val) => val.startsWith('room_'), 'Invalid room ID format'),
  playerName: z
    .string()
    .min(1, 'Player name is required')
    .max(20, 'Player name too long')
    .trim()
    .refine((val) => val.length > 0, 'Player name cannot be empty'),
  clientId: z.string().min(1, 'Client ID is required'),
});

export const roomIdSchema = z.object({
  roomId: z
    .string()
    .min(1, 'Room ID is required')
    .refine((val) => val.startsWith('room_'), 'Invalid room ID format'),
});

export const rejoinRoomSchema = z.object({
  roomId: z
    .string()
    .min(1, 'Room ID is required')
    .refine((val) => val.startsWith('room_'), 'Invalid room ID format'),
  clientId: z.string().min(1, 'Client ID is required'),
});

// Validation helper with consistent error handling
export const validateSocketData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw GameErrors.INVALID_DATA(
      `${firstError.path.join('.')}: ${firstError.message}`,
    );
  }
  return result.data;
};

// Additional validation helpers
export const validateRoomExists = (room: any, roomId: string) => {
  if (!room) throw GameErrors.ROOM_NOT_FOUND(roomId);
};

export const validateGameStarted = (gameStarted: boolean) => {
  if (!gameStarted) throw GameErrors.GAME_NOT_STARTED();
};

export const validateGameNotOver = (winner: string | null) => {
  if (winner) throw GameErrors.GAME_OVER();
};

export const validatePlayerTurn = (
  currentTurn: string | null,
  playerId: string,
) => {
  if (currentTurn !== playerId) throw GameErrors.NOT_YOUR_TURN();
};

export const validateIsHost = (hostId: string, playerId: string) => {
  if (hostId !== playerId)
    throw GameErrors.NOT_HOST('Only the host can perform this action');
};

export const validateRoomNotFull = (
  playerCount: number,
  maxPlayers: number,
) => {
  if (playerCount >= maxPlayers) throw GameErrors.ROOM_FULL();
};

export const validateMinimumPlayers = (
  playerCount: number,
  minimum: number = 2,
) => {
  if (playerCount < minimum) {
    throw GameErrors.INSUFFICIENT_PLAYERS(`Need at least ${minimum} players`);
  }
};
