import { applyRoll, getXYFromSquare, getPlayerOffset } from '@/lib/logic';

describe('applyRoll', () => {
  it('moves player correctly within board', () => {
    expect(applyRoll(1, 1)).toBe(23);
    expect(applyRoll(5, 3)).toBe(8);
    expect(applyRoll(53, 6)).toBe(59);
  });

  it('stops at 100 when reaching or exceeding it', () => {
    expect(applyRoll(99, 6)).toBe(100);
    expect(applyRoll(95, 5)).toBe(100);
    expect(applyRoll(99, 1)).toBe(100);
  });

  it('handles exact landing on 100', () => {
    expect(applyRoll(94, 6)).toBe(100);
  });

  it('applies snake/ladder if landing on special square', () => {
    // square 6 has a ladder to 45
    expect(applyRoll(1, 5)).toBe(45);
    // square 56 has a snake to 8
    expect(applyRoll(53, 3)).toBe(8);
  });
});

describe('getXYFromSquare', () => {
  it('returns correct position for square 1 (bottom-left)', () => {
    expect(getXYFromSquare(1)).toEqual({ x: 20, y: 560 });
  });

  it('returns correct position for square 10 (bottom-right)', () => {
    expect(getXYFromSquare(10)).toEqual({ x: 560, y: 560 });
  });

  it('returns correct position for square 91 (top-right)', () => {
    expect(getXYFromSquare(91)).toEqual({ x: 560, y: 20 });
  });

  it('returns correct position for square 100 (top-left)', () => {
    expect(getXYFromSquare(100)).toEqual({ x: 20, y: 20 });
  });
});

describe('getPlayerOffset', () => {
  it('returns centered position for single player on square', () => {
    expect(getPlayerOffset(0, 1)).toEqual({ x: 0, y: 0 });
  });

  it('returns top-left offset for first player when multiple on square', () => {
    expect(getPlayerOffset(0, 2)).toEqual({ x: -8, y: -8 });
    expect(getPlayerOffset(0, 3)).toEqual({ x: -8, y: -8 });
    expect(getPlayerOffset(0, 4)).toEqual({ x: -8, y: -8 });
  });

  it('returns top-right offset for second player when multiple on square', () => {
    expect(getPlayerOffset(1, 2)).toEqual({ x: 8, y: -8 });
    expect(getPlayerOffset(1, 3)).toEqual({ x: 8, y: -8 });
    expect(getPlayerOffset(1, 4)).toEqual({ x: 8, y: -8 });
  });

  it('returns bottom-left offset for third player when multiple on square', () => {
    expect(getPlayerOffset(2, 3)).toEqual({ x: -8, y: 8 });
    expect(getPlayerOffset(2, 4)).toEqual({ x: -8, y: 8 });
  });

  it('returns bottom-right offset for fourth player when multiple on square', () => {
    expect(getPlayerOffset(3, 4)).toEqual({ x: 8, y: 8 });
  });

  it('handles all four players on same square with correct corner positions', () => {
    // Player 1: Top-left
    expect(getPlayerOffset(0, 4)).toEqual({ x: -8, y: -8 });
    // Player 2: Top-right
    expect(getPlayerOffset(1, 4)).toEqual({ x: 8, y: -8 });
    // Player 3: Bottom-left
    expect(getPlayerOffset(2, 4)).toEqual({ x: -8, y: 8 });
    // Player 4: Bottom-right
    expect(getPlayerOffset(3, 4)).toEqual({ x: 8, y: 8 });
  });
});
