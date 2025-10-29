export class GameError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameError';
  }
}

export const GameErrors = {
  // Room errors
  ROOM_NOT_FOUND: (id: string) =>
    new GameError(`Room ${id} not found`, 'ROOM_NOT_FOUND'),
  ROOM_FULL: () => new GameError('Room is full', 'ROOM_FULL'),
  ROOM_EMPTY: () => new GameError('Room is empty', 'ROOM_EMPTY'),

  // Game state errors
  GAME_ALREADY_STARTED: () =>
    new GameError('Game already started', 'GAME_ALREADY_STARTED'),
  GAME_NOT_STARTED: () =>
    new GameError('Game not started yet', 'GAME_NOT_STARTED'),
  GAME_OVER: () => new GameError('Game is over!', 'GAME_OVER'),

  // Player errors
  NOT_YOUR_TURN: () => new GameError('Not your turn!', 'NOT_YOUR_TURN'),
  NOT_HOST: (message: string) => new GameError(message, 'NOT_HOST'),
  INSUFFICIENT_PLAYERS: (message: string) =>
    new GameError(message, 'INSUFFICIENT_PLAYERS'),
  PLAYER_NOT_FOUND: (id: string) =>
    new GameError(`Player ${id} not found`, 'PLAYER_NOT_FOUND'),

  // Validation errors
  INVALID_DATA: (field: string) =>
    new GameError(`Invalid ${field}`, 'INVALID_DATA'),
  INVALID_ROOM_NAME: () =>
    new GameError('Room name must be 1-50 characters', 'INVALID_ROOM_NAME'),
  INVALID_PLAYER_NAME: () =>
    new GameError('Player name must be 1-20 characters', 'INVALID_PLAYER_NAME'),
  INVALID_ROOM_ID: () =>
    new GameError('Invalid room ID format', 'INVALID_ROOM_ID'),
} as const;
