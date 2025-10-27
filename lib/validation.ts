import { z } from 'zod';

export const moveSchema = z.object({
  roll: z.number().int().min(1).max(6),
});

export const createRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name too long')
    .trim(),
  playerName: z
    .string()
    .min(1, 'Player name is required')
    .max(20, 'Player name too long')
    .trim(),
});

export const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  playerName: z
    .string()
    .min(1, 'Player name is required')
    .max(20, 'Player name too long')
    .trim(),
});

export const roomIdSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
});
