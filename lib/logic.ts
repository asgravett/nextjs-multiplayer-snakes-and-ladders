import { snakesAndLadders } from './constants';

export function applyRoll(current: number, roll: number): number {
  let next = current + roll;

  if (next >= 100) {
    return 100;
  }

  if (snakesAndLadders[next]) {
    next = snakesAndLadders[next];
  }

  return next;
}

export function getXYFromSquare(square: number): { x: number; y: number } {
  // Square 0 is the starting position (before square 1)
  if (square === 0) {
    return { x: 20, y: 570 };
  }

  // Adjust for 1-based indexing (square 1 is at position 0)
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
  // y: 600 at bottom (row 0), 0 at top (row 9)
  const x = 20 + col * 60;
  const y = (9 - row) * 60 + 20;

  return { x, y };
}
