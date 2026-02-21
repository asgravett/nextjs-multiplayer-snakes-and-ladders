import { z } from 'zod';
import { GameState, RoomInfo, Room } from './types';

// ============================================
// Zod Schemas for Runtime Validation
// ============================================

export const createRoomPayloadSchema = z.object({
  roomName: z.string().min(1).max(50),
  playerName: z.string().min(1).max(20),
  clientId: z.string().min(1),
});

export const joinRoomPayloadSchema = z.object({
  roomId: z.string().min(1),
  playerName: z.string().min(1).max(20),
  clientId: z.string().min(1),
});

export const roomIdPayloadSchema = z.object({
  roomId: z.string().min(1),
});

export const rejoinRoomPayloadSchema = z.object({
  roomId: z.string().min(1),
  clientId: z.string().min(1),
});

// ============================================
// TypeScript Types (derived from schemas)
// ============================================

export type CreateRoomPayload = z.infer<typeof createRoomPayloadSchema>;
export type JoinRoomPayload = z.infer<typeof joinRoomPayloadSchema>;
export type RoomIdPayload = z.infer<typeof roomIdPayloadSchema>;
export type RejoinRoomPayload = z.infer<typeof rejoinRoomPayloadSchema>;

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
  roomLeft: () => void; // Add this new event

  // Game events
  gameState: (state: GameState) => void;
  diceRolled: (data: {
    playerId: string;
    roll: number;
    newPosition: number;
  }) => void;
  gameWon: (data: { winner: string }) => void;
  gameReset: () => void;

  // Host events
  hostChanged: (data: { newHostId: string }) => void;

  // Rejoin events
  rejoinFailed: (data: { reason: string }) => void;

  // Error events
  error: (data: { message: string }) => void;
}

// ============================================
// Client -> Server Events
// ============================================

export interface ClientToServerEvents {
  // Room management
  createRoom: (data: CreateRoomPayload) => void;
  joinRoom: (data: JoinRoomPayload) => void;
  leaveRoom: (data: RoomIdPayload) => void;
  rejoinRoom: (data: RejoinRoomPayload) => void;

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
