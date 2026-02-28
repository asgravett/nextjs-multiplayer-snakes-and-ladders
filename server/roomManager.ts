import { Room, GameState } from '@/lib/types';
import { GAME_CONFIG } from '@/lib/constants';
import { pubClient } from './redis';

const ROOM_KEY_PREFIX = 'room:';
const ROOM_TTL = Number(process.env.ROOM_TTL) || 3600; // seconds — auto-expiry for stale rooms

export class RoomManager {
  // ─── Key helpers ──────────────────────────────────────────────────────────
  private key(roomId: string): string {
    return `${ROOM_KEY_PREFIX}${roomId}`;
  }

  // ─── Core CRUD ────────────────────────────────────────────────────────────

  async create(
    roomId: string,
    roomName: string,
    hostId: string,
  ): Promise<Room> {
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
    await this.save(room);
    return room;
  }

  async get(roomId: string): Promise<Room | undefined> {
    const data = await pubClient.get(this.key(roomId));
    return data ? (JSON.parse(data as string) as Room) : undefined;
  }

  async save(room: Room): Promise<void> {
    await pubClient.set(this.key(room.id), JSON.stringify(room), {
      EX: ROOM_TTL,
    });
  }

  async delete(roomId: string): Promise<boolean> {
    const result = await pubClient.del(this.key(roomId));
    return Number(result) > 0;
  }

  async getAll(): Promise<Room[]> {
    const keys = await pubClient.keys(`${ROOM_KEY_PREFIX}*`);
    if (keys.length === 0) return [];
    const values = await pubClient.mGet(keys);
    return values
      .filter((v): v is string => v !== null)
      .map((v) => JSON.parse(v) as Room);
  }

  async getRoomsInfo() {
    const rooms = await this.getAll();
    return rooms.map((r) => ({
      id: r.id,
      name: r.name,
      playerCount: Object.keys(r.gameState.players).length,
      maxPlayers: r.maxPlayers,
      gameStarted: r.gameState.gameStarted,
    }));
  }

  // ─── Player management ────────────────────────────────────────────────────

  async addPlayer(
    roomId: string,
    playerId: string,
    playerName: string,
    clientId: string,
  ): Promise<void> {
    const room = await this.get(roomId);
    if (!room) return;

    room.gameState.players[playerId] = {
      id: playerId,
      position: GAME_CONFIG.STARTING_POSITION,
      name: playerName,
      clientId,
    };
    room.gameState.playerOrder.push(playerId);
    await this.save(room);
  }

  async removePlayer(roomId: string, playerId: string): Promise<boolean> {
    const room = await this.get(roomId);
    if (!room) return false;

    delete room.gameState.players[playerId];
    room.gameState.playerOrder = room.gameState.playerOrder.filter(
      (id) => id !== playerId,
    );

    // Update current turn if needed
    if (room.gameState.currentTurn === playerId) {
      room.gameState.currentTurn = this.getNextTurn(room.gameState);
    }

    // Check if room is empty
    if (Object.keys(room.gameState.players).length === 0) {
      await this.delete(roomId);
      return true; // Room deleted
    }

    // Transfer host if needed
    if (room.host === playerId) {
      room.host = room.gameState.playerOrder[0];
    }

    await this.save(room);
    return false; // Room still exists
  }

  // ─── Turn helpers (pure — operate on a GameState snapshot) ────────────────

  getNextTurn(gameState: GameState): string | null {
    // Only consider connected (active) players
    const activePlayers = gameState.playerOrder.filter(
      (id) => gameState.players[id] && !gameState.players[id].disconnected,
    );
    if (activePlayers.length === 0) return null;
    const currentIndex = activePlayers.indexOf(gameState.currentTurn || '');
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    return activePlayers[nextIndex];
  }

  getNextActiveTurn(
    gameState: GameState,
    afterPlayerId: string,
  ): string | null {
    const order = gameState.playerOrder;
    const startIdx = order.indexOf(afterPlayerId);
    if (startIdx === -1) return null;
    for (let i = 1; i <= order.length; i++) {
      const candidateId = order[(startIdx + i) % order.length];
      if (
        gameState.players[candidateId] &&
        !gameState.players[candidateId].disconnected
      ) {
        return candidateId;
      }
    }
    return null;
  }

  // ─── Disconnect / reconnect helpers ───────────────────────────────────────

  async markPlayerDisconnected(
    roomId: string,
    socketId: string,
  ): Promise<void> {
    const room = await this.get(roomId);
    if (!room || !room.gameState.players[socketId]) return;
    room.gameState.players[socketId].disconnected = true;
    await this.save(room);
  }

  async findPlayerByClientId(
    roomId: string,
    clientId: string,
  ): Promise<GameState['players'][string] | undefined> {
    const room = await this.get(roomId);
    if (!room) return undefined;
    return Object.values(room.gameState.players).find(
      (p) => p.clientId === clientId,
    );
  }

  async reconnectPlayer(
    roomId: string,
    oldSocketId: string,
    newSocketId: string,
  ): Promise<void> {
    const room = await this.get(roomId);
    if (!room) return;
    const player = room.gameState.players[oldSocketId];
    if (!player) return;

    // Move entry to new socket ID
    player.id = newSocketId;
    player.disconnected = false;
    delete room.gameState.players[oldSocketId];
    room.gameState.players[newSocketId] = player;

    // Update playerOrder
    const idx = room.gameState.playerOrder.indexOf(oldSocketId);
    if (idx !== -1) room.gameState.playerOrder[idx] = newSocketId;

    // If it was their turn, update
    if (room.gameState.currentTurn === oldSocketId) {
      room.gameState.currentTurn = newSocketId;
    }

    await this.save(room);
  }

  async findPlayerRoom(playerId: string): Promise<Room | undefined> {
    const rooms = await this.getAll();
    return rooms.find((room) => room.gameState.players[playerId]);
  }
}

export const roomManager = new RoomManager();
