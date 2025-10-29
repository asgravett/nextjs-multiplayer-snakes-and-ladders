// Position and result of landing on the snake or ladder
export const SNAKES_AND_LADDERS: Record<number, number> = {
  2: 23,
  4: 68,
  6: 45,
  20: 59,
  30: 96,
  43: 17,
  50: 5,
  52: 72,
  56: 8,
  57: 96,
  71: 92,
  73: 15,
  84: 58,
  87: 49,
  98: 40,
} as const;

// Positions for 2-4 players in corners of a square
export const PLAYER_PIECE_OFFSETS: Array<{ x: number; y: number }> = [
  { x: -8, y: -8 }, // Top-left
  { x: 8, y: -8 }, // Top-right
  { x: -8, y: 8 }, // Bottom-left
  { x: 8, y: 8 }, // Bottom-right
] as const;

// Colormap for the 4 player pieces
export const COLOR_MAP: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
} as const;

export const GAME_CONFIG = {
  MAX_PLAYERS: 4,
  BOARD_SIZE: 100,
  DICE_SIDES: 6,
  STARTING_POSITION: 1,
  WINNING_POSITION: 100,
} as const;

export const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
