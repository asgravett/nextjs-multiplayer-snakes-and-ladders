import { applyRoll } from '@/lib/logic';

describe('applyRoll', () => {
  it('moves player correctly within board', () => {
    expect(applyRoll(0, 4)).toBe(4);
  });

  it('bounces back when overshooting 100', () => {
    expect(applyRoll(99, 6)).toBeLessThanOrEqual(100);
  });
});
