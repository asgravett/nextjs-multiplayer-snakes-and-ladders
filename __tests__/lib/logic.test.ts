import {
  applyRoll,
  getXYFromSquare,
  getPlayerOffset,
  rollDice,
} from '@/lib/logic';
import {
  GAME_CONFIG,
  PLAYER_PIECE_OFFSETS,
  SNAKES_AND_LADDERS,
} from '@/lib/constants';

// ─── applyRoll ───────────────────────────────────────────────────────────────

describe('applyRoll', () => {
  describe('normal movement', () => {
    test('should move the player forward by the exact dice value when no special square', () => {
      // position 10, roll 5 → 15 (no snake/ladder at 15)
      expect(applyRoll(10, 5)).toBe(15);
    });

    test('should move from position 1 correctly', () => {
      // 1 + 3 = 4 → ladder to 68
      expect(applyRoll(1, 3)).toBe(68);
    });
  });

  describe('winning condition', () => {
    test('should return the winning position when the player lands exactly on 100', () => {
      expect(applyRoll(94, 6)).toBe(GAME_CONFIG.WINNING_POSITION);
    });

    test('should return the winning position when the roll overshoots 100', () => {
      expect(applyRoll(99, 6)).toBe(GAME_CONFIG.WINNING_POSITION);
      expect(applyRoll(95, 5)).toBe(GAME_CONFIG.WINNING_POSITION);
    });

    test('should return the winning position when landing exactly 1 step away', () => {
      expect(applyRoll(99, 1)).toBe(GAME_CONFIG.WINNING_POSITION);
    });
  });

  describe('snakes', () => {
    test('should slide the player down when landing on a snake head', () => {
      // snake: 43 → 17
      expect(applyRoll(40, 3)).toBe(17);
    });

    test('should apply all defined snakes correctly', () => {
      const snakeHeads = Object.entries(SNAKES_AND_LADDERS)
        .filter(([, dest]) => dest < Number(Object.keys(SNAKES_AND_LADDERS)[0]))
        .map(([src]) => Number(src));

      // For every snake/ladder entry where destination < source (i.e. a snake),
      // landing there should transport the player to the destination.
      const snakes = Object.entries(SNAKES_AND_LADDERS).filter(
        ([src, dest]) => dest < Number(src),
      );
      snakes.forEach(([src, dest]) => {
        // Roll 0 is not possible in the game, so reach the square from src-1 with roll 1
        expect(applyRoll(Number(src) - 1, 1)).toBe(dest);
      });
    });
  });

  describe('ladders', () => {
    test('should climb the player up when landing on a ladder base', () => {
      // ladder: 6 → 45
      expect(applyRoll(1, 5)).toBe(45);
    });

    test('should apply all defined ladders correctly', () => {
      const ladders = Object.entries(SNAKES_AND_LADDERS).filter(
        ([src, dest]) => dest > Number(src),
      );
      ladders.forEach(([src, dest]) => {
        expect(applyRoll(Number(src) - 1, 1)).toBe(dest);
      });
    });
  });

  describe('boundary positions', () => {
    test('should handle starting position (1) with a roll of 1', () => {
      // 1 + 1 = 2 → ladder to 23
      expect(applyRoll(GAME_CONFIG.STARTING_POSITION, 1)).toBe(23);
    });

    test('should handle a roll from position 1 with minimum dice value', () => {
      expect(applyRoll(1, 1)).toBe(23);
    });

    test('should not go below position 1', () => {
      // The lowest any snake tail lands is 5 (snake from 50)
      const result = applyRoll(49, 1);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── getXYFromSquare ─────────────────────────────────────────────────────────

describe('getXYFromSquare', () => {
  describe('corner squares', () => {
    test('should return the bottom-left position for square 1', () => {
      expect(getXYFromSquare(1)).toEqual({ x: 20, y: 560 });
    });

    test('should return the bottom-right position for square 10', () => {
      expect(getXYFromSquare(10)).toEqual({ x: 560, y: 560 });
    });

    test('should return the top-right position for square 91', () => {
      expect(getXYFromSquare(91)).toEqual({ x: 560, y: 20 });
    });

    test('should return the top-left position for square 100', () => {
      expect(getXYFromSquare(100)).toEqual({ x: 20, y: 20 });
    });
  });

  describe('row direction alternation', () => {
    test('should go left-to-right on row 0 (squares 1–10)', () => {
      const sq1 = getXYFromSquare(1);
      const sq10 = getXYFromSquare(10);
      expect(sq10.x).toBeGreaterThan(sq1.x);
      expect(sq10.y).toBe(sq1.y);
    });

    test('should go right-to-left on row 1 (squares 11–20)', () => {
      const sq11 = getXYFromSquare(11);
      const sq20 = getXYFromSquare(20);
      expect(sq11.x).toBeGreaterThan(sq20.x);
      expect(sq11.y).toBe(sq20.y);
    });

    test('should go left-to-right again on row 2 (squares 21–30)', () => {
      const sq21 = getXYFromSquare(21);
      const sq30 = getXYFromSquare(30);
      expect(sq30.x).toBeGreaterThan(sq21.x);
    });
  });

  describe('row elevation', () => {
    test('higher square numbers should have a smaller y value (closer to top)', () => {
      const low = getXYFromSquare(1);
      const high = getXYFromSquare(91);
      expect(high.y).toBeLessThan(low.y);
    });

    test('each row should be 60px higher than the previous', () => {
      const row0 = getXYFromSquare(1).y;
      const row1 = getXYFromSquare(11).y;
      expect(row0 - row1).toBe(60);
    });
  });

  describe('coordinate precision', () => {
    test('should return integer pixel coordinates', () => {
      for (let sq = 1; sq <= 100; sq++) {
        const { x, y } = getXYFromSquare(sq);
        expect(Number.isInteger(x)).toBe(true);
        expect(Number.isInteger(y)).toBe(true);
      }
    });

    test('should return unique coordinates for every square on the board', () => {
      const positions = new Set<string>();
      for (let sq = 1; sq <= 100; sq++) {
        const { x, y } = getXYFromSquare(sq);
        positions.add(`${x},${y}`);
      }
      expect(positions.size).toBe(100);
    });
  });
});

// ─── getPlayerOffset ─────────────────────────────────────────────────────────

describe('getPlayerOffset', () => {
  test('should return { x: 0, y: 0 } when only one player is on the square', () => {
    expect(getPlayerOffset(0, 1)).toEqual({ x: 0, y: 0 });
  });

  test('should return the top-left offset for player index 0 when multiple share a square', () => {
    expect(getPlayerOffset(0, 2)).toEqual(PLAYER_PIECE_OFFSETS[0]);
    expect(getPlayerOffset(0, 3)).toEqual(PLAYER_PIECE_OFFSETS[0]);
    expect(getPlayerOffset(0, 4)).toEqual(PLAYER_PIECE_OFFSETS[0]);
  });

  test('should return the top-right offset for player index 1', () => {
    expect(getPlayerOffset(1, 2)).toEqual(PLAYER_PIECE_OFFSETS[1]);
    expect(getPlayerOffset(1, 3)).toEqual(PLAYER_PIECE_OFFSETS[1]);
    expect(getPlayerOffset(1, 4)).toEqual(PLAYER_PIECE_OFFSETS[1]);
  });

  test('should return the bottom-left offset for player index 2', () => {
    expect(getPlayerOffset(2, 3)).toEqual(PLAYER_PIECE_OFFSETS[2]);
    expect(getPlayerOffset(2, 4)).toEqual(PLAYER_PIECE_OFFSETS[2]);
  });

  test('should return the bottom-right offset for player index 3', () => {
    expect(getPlayerOffset(3, 4)).toEqual(PLAYER_PIECE_OFFSETS[3]);
  });

  test('should return correct offsets for all four players on the same square', () => {
    expect(getPlayerOffset(0, 4)).toEqual(PLAYER_PIECE_OFFSETS[0]);
    expect(getPlayerOffset(1, 4)).toEqual(PLAYER_PIECE_OFFSETS[1]);
    expect(getPlayerOffset(2, 4)).toEqual(PLAYER_PIECE_OFFSETS[2]);
    expect(getPlayerOffset(3, 4)).toEqual(PLAYER_PIECE_OFFSETS[3]);
  });

  test('should return { x: 0, y: 0 } as a safe fallback for an out-of-bounds player index', () => {
    expect(getPlayerOffset(4, 4)).toEqual({ x: 0, y: 0 });
    expect(getPlayerOffset(5, 2)).toEqual({ x: 0, y: 0 });
    expect(getPlayerOffset(99, 4)).toEqual({ x: 0, y: 0 });
  });
});

// ─── rollDice ─────────────────────────────────────────────────────────────────

describe('rollDice', () => {
  test('should return an integer between 1 and DICE_SIDES inclusive', () => {
    const roll = rollDice();
    expect(roll).toBeGreaterThanOrEqual(1);
    expect(roll).toBeLessThanOrEqual(GAME_CONFIG.DICE_SIDES);
    expect(Number.isInteger(roll)).toBe(true);
  });

  test('should produce values across the full 1–6 range over many rolls', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      seen.add(rollDice());
    }
    for (let face = 1; face <= GAME_CONFIG.DICE_SIDES; face++) {
      expect(seen).toContain(face);
    }
  });

  test('should never return a value outside the valid range over many rolls', () => {
    for (let i = 0; i < 500; i++) {
      const roll = rollDice();
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(GAME_CONFIG.DICE_SIDES);
    }
  });
});
