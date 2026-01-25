import { z } from 'zod';
import { GameState, RoomInfo, Room } from './types';

// ============================================
// Zod Schemas for Runtime Validation
// ============================================

export const createRoomPayloadSchema = z.object({
  roomName: z.string().min(1).max(50),
  playerName: z.string().min(1).max(20),
});

export const joinRoomPayloadSchema = z.object({
  roomId: z.string().min(1),
  playerName: z.string().min(1).max(20),
});

export const roomIdPayloadSchema = z.object({
  roomId: z.string().min(1),
});

// ============================================
// TypeScript Types (derived from schemas)
// ============================================

export type CreateRoomPayload = z.infer<typeof createRoomPayloadSchema>;
export type JoinRoomPayload = z.infer<typeof joinRoomPayloadSchema>;
export type RoomIdPayload = z.infer<typeof roomIdPayloadSchema>;

// ============================================
// Server -> Client Events
// ============================================

export interface ServerToClientEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;

  // Room events
  roomsList: (rooms: RoomInfo[]) => void;
  roomJoined: (data: { roomId: string; room: Room }) => void;

  // Game state events
  gameState: (state: GameState) => void;
  diceRolled: (data: {
    playerId: string;
    roll: number;
    newPosition: number;
  }) => void;
  gameWon: (data: { winner: string; winnerId: string }) => void;
  gameReset: (data: Record<string, never>) => void;

  // Error handling
  error: (data: { message: string; code?: string }) => void;
}

// ============================================
// Client -> Server Events
// ============================================

export interface ClientToServerEvents {
  // Room management
  createRoom: (data: CreateRoomPayload) => void;
  joinRoom: (data: JoinRoomPayload) => void;
  leaveRoom: (data: RoomIdPayload) => void;

  // Game actions
  startGame: (data: RoomIdPayload) => void;
  rollDice: (data: RoomIdPayload) => void;
  resetGame: (data: RoomIdPayload) => void;
}

// ============================================
// Inter-Server Events (for scaling with Redis)
// ============================================

export interface InterServerEvents {
  ping: () => void;
}

// ============================================
// Socket Data (per-socket state)
// ============================================

export interface SocketData {
  playerId: string;
  playerName: string;
  currentRoomId: string | null;
}
