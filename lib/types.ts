// Player types
export type Player = {
  id: string;
  position: number;
  name: string;
  clientId: string;
  disconnected?: boolean;
};

// Game state
export type GameState = {
  players: Record<string, Player>;
  currentTurn: string | null;
  playerOrder: string[];
  winner: string | null;
  gameStarted: boolean;
};

// Room info
export type RoomInfo = {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameStarted: boolean;
};

// Room
export type Room = {
  id: string;
  name: string;
  host: string;
  gameState: GameState;
  maxPlayers: number;
};
