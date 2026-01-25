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

  addPlayer(roomId: string, playerId: string, playerName: string): void {
    const room = this.get(roomId);
    if (!room) return;

    room.gameState.players[playerId] = {
      id: playerId,
      position: GAME_CONFIG.STARTING_POSITION,
      name: playerName,
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
    if (gameState.playerOrder.length === 0) return null;
    const currentIndex = gameState.playerOrder.indexOf(
      gameState.currentTurn || '',
    );
    const nextIndex = (currentIndex + 1) % gameState.playerOrder.length;
    return gameState.playerOrder[nextIndex];
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
