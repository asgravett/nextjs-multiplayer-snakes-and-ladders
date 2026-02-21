import { Room, GameState } from '@/lib/types';
import { GAME_CONFIG } from '@/lib/constants';

export class RoomManager {
  private rooms = new Map<string, Room>();

  create(roomId: string, roomName: string, hostId: string): Room {
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
    this.rooms.set(roomId, room);
    return room;
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  delete(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  getAll(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoomsInfo() {
    return this.getAll().map((r) => ({
      id: r.id,
      name: r.name,
      playerCount: Object.keys(r.gameState.players).length,
      maxPlayers: r.maxPlayers,
      gameStarted: r.gameState.gameStarted,
    }));
  }

  addPlayer(
    roomId: string,
    playerId: string,
    playerName: string,
    clientId: string,
  ): void {
    const room = this.get(roomId);
    if (!room) return;

    room.gameState.players[playerId] = {
      id: playerId,
      position: GAME_CONFIG.STARTING_POSITION,
      name: playerName,
      clientId,
    };
    room.gameState.playerOrder.push(playerId);
  }

  removePlayer(roomId: string, playerId: string): boolean {
    const room = this.get(roomId);
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
      this.delete(roomId);
      return true; // Room deleted
    }

    // Transfer host if needed
    if (room.host === playerId) {
      room.host = room.gameState.playerOrder[0];
    }

    return false; // Room still exists
  }

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

  // Returns the next active player after `afterPlayerId` in turn order,
  // used when that player has just been marked disconnected.
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
    return null; // All players disconnected
  }

  markPlayerDisconnected(roomId: string, socketId: string): void {
    const room = this.get(roomId);
    if (!room || !room.gameState.players[socketId]) return;
    room.gameState.players[socketId].disconnected = true;
  }

  findPlayerByClientId(
    roomId: string,
    clientId: string,
  ): GameState['players'][string] | undefined {
    const room = this.get(roomId);
    if (!room) return undefined;
    return Object.values(room.gameState.players).find(
      (p) => p.clientId === clientId,
    );
  }

  reconnectPlayer(
    roomId: string,
    oldSocketId: string,
    newSocketId: string,
  ): void {
    const room = this.get(roomId);
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

    // If it was their turn (e.g. turn was held while they were gone), update
    if (room.gameState.currentTurn === oldSocketId) {
      room.gameState.currentTurn = newSocketId;
    }
  }

  findPlayerRoom(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.gameState.players[playerId]) {
        return room;
      }
    }
    return undefined;
  }
}

export const roomManager = new RoomManager();
