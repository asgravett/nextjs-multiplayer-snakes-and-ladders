import {
  SNAKES_AND_LADDERS,
  GAME_CONFIG,
  PLAYER_PIECE_OFFSETS,
} from './constants';

export function applyRoll(current: number, roll: number): number {
  let next = current + roll;

  if (next >= GAME_CONFIG.WINNING_POSITION) {
    return GAME_CONFIG.WINNING_POSITION;
  }

  if (SNAKES_AND_LADDERS[next]) {
    next = SNAKES_AND_LADDERS[next];
  }

  return next;
}

export function getXYFromSquare(square: number): { x: number; y: number } {
  // Adjust for 1-based indexing (square 1 is at index 0)
  const adjustedSquare = square - 1;

  // Calculate row from bottom (0 = bottom row, 9 = top row)
  const row = Math.floor(adjustedSquare / 10);

  // Calculate column based on snake pattern (alternating left-to-right, right-to-left)
  let col;
  if (row % 2 === 0) {
    // Even rows (0, 2, 4...) go left to right
    col = adjustedSquare % 10;
  } else {
    // Odd rows (1, 3, 5...) go right to left
    col = 9 - (adjustedSquare % 10);
  }

  // Convert to pixel coordinates
  const x = 20 + col * 60;
  const y = 560 - row * 60;

  return { x, y };
}

export function getPlayerOffset(
  playerIndex: number,
  totalOnSquare: number
): { x: number; y: number } {
  if (totalOnSquare === 1) {
    return { x: 0, y: 0 };
  }

  return PLAYER_PIECE_OFFSETS[playerIndex] || { x: 0, y: 0 };
}

export function rollDice(): number {
  return Math.floor(Math.random() * GAME_CONFIG.DICE_SIDES) + 1;
}
