// Position and result of landing on the snake or ladder
export const snakesAndLadders: Record<number, number> = {
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
};

// Positions for 2-4 players in corners of a square
export const playerPieceOffsets: Array<{ x: number; y: number }> = [
  { x: -8, y: -8 }, // Top-left
  { x: 8, y: -8 }, // Top-right
  { x: -8, y: 8 }, // Bottom-left
  { x: 8, y: 8 }, // Bottom-right
];

// Colormap for the 4 player pieces
export const colorMap: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
};
