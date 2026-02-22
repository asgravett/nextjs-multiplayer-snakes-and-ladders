import {
  moveSchema,
  createRoomSchema,
  joinRoomSchema,
  roomIdSchema,
  rejoinRoomSchema,
  validateSocketData,
  validateRoomExists,
  validateGameStarted,
  validateGameNotOver,
  validatePlayerTurn,
  validateIsHost,
  validateRoomNotFull,
  validateMinimumPlayers,
} from '@/lib/validation';
import { GameError } from '@/lib/gameErrors';
import type { Room } from '@/lib/types';

// ─── moveSchema ─────────────────────────────────────────────────────────────

describe('moveSchema', () => {
  test('should accept valid dice roll values 1–6', () => {
    for (let i = 1; i <= 6; i++) {
      expect(() => moveSchema.parse({ roll: i })).not.toThrow();
    }
  });

  test('should reject a roll of 0', () => {
    expect(() => moveSchema.parse({ roll: 0 })).toThrow();
  });

  test('should reject a roll greater than 6', () => {
    expect(() => moveSchema.parse({ roll: 7 })).toThrow();
  });

  test('should reject a non-integer roll', () => {
    expect(() => moveSchema.parse({ roll: 1.5 })).toThrow();
  });

  test('should reject a string roll', () => {
    expect(() => moveSchema.parse({ roll: '3' })).toThrow();
  });
});

// ─── createRoomSchema ────────────────────────────────────────────────────────

describe('createRoomSchema', () => {
  const valid = {
    roomName: 'Test Room',
    playerName: 'Alice',
    clientId: 'client-1',
  };

  test('should accept a valid payload', () => {
    expect(() => createRoomSchema.parse(valid)).not.toThrow();
  });

  test('should reject when roomName is empty', () => {
    expect(() => createRoomSchema.parse({ ...valid, roomName: '' })).toThrow();
  });

  test('should reject when roomName exceeds 50 characters', () => {
    expect(() =>
      createRoomSchema.parse({ ...valid, roomName: 'a'.repeat(51) }),
    ).toThrow();
  });

  test('should reject when playerName is empty', () => {
    expect(() =>
      createRoomSchema.parse({ ...valid, playerName: '' }),
    ).toThrow();
  });

  test('should reject when playerName exceeds 20 characters', () => {
    expect(() =>
      createRoomSchema.parse({ ...valid, playerName: 'a'.repeat(21) }),
    ).toThrow();
  });

  test('should reject when clientId is empty', () => {
    expect(() => createRoomSchema.parse({ ...valid, clientId: '' })).toThrow();
  });

  test('should trim whitespace from roomName and playerName', () => {
    const result = createRoomSchema.parse({
      roomName: '  My Room  ',
      playerName: '  Alice  ',
      clientId: 'client-1',
    });
    expect(result.roomName).toBe('My Room');
    expect(result.playerName).toBe('Alice');
  });

  test('should reject a roomName that is only whitespace', () => {
    expect(() =>
      createRoomSchema.parse({ ...valid, roomName: '   ' }),
    ).toThrow();
  });
});

// ─── joinRoomSchema ──────────────────────────────────────────────────────────

describe('joinRoomSchema', () => {
  const valid = {
    roomId: 'room_123_abc',
    playerName: 'Bob',
    clientId: 'client-2',
  };

  test('should accept a valid payload', () => {
    expect(() => joinRoomSchema.parse(valid)).not.toThrow();
  });

  test('should reject a roomId not starting with room_', () => {
    expect(() =>
      joinRoomSchema.parse({ ...valid, roomId: 'invalid_id' }),
    ).toThrow();
  });

  test('should reject an empty roomId', () => {
    expect(() => joinRoomSchema.parse({ ...valid, roomId: '' })).toThrow();
  });

  test('should reject an empty playerName', () => {
    expect(() => joinRoomSchema.parse({ ...valid, playerName: '' })).toThrow();
  });

  test('should reject a playerName exceeding 20 characters', () => {
    expect(() =>
      joinRoomSchema.parse({ ...valid, playerName: 'a'.repeat(21) }),
    ).toThrow();
  });

  test('should reject when clientId is missing', () => {
    const { clientId: _, ...withoutClientId } = valid;
    expect(() => joinRoomSchema.parse(withoutClientId)).toThrow();
  });
});

// ─── roomIdSchema ────────────────────────────────────────────────────────────

describe('roomIdSchema', () => {
  test('should accept a valid room_xxx format', () => {
    expect(() => roomIdSchema.parse({ roomId: 'room_abc123' })).not.toThrow();
  });

  test('should reject a roomId without the room_ prefix', () => {
    expect(() => roomIdSchema.parse({ roomId: 'abc123' })).toThrow();
  });

  test('should reject an empty roomId', () => {
    expect(() => roomIdSchema.parse({ roomId: '' })).toThrow();
  });

  test('should reject when roomId field is missing entirely', () => {
    expect(() => roomIdSchema.parse({})).toThrow();
  });
});

// ─── rejoinRoomSchema ────────────────────────────────────────────────────────

describe('rejoinRoomSchema', () => {
  const valid = { roomId: 'room_abc', clientId: 'client-1' };

  test('should accept a valid payload', () => {
    expect(() => rejoinRoomSchema.parse(valid)).not.toThrow();
  });

  test('should reject an empty clientId', () => {
    expect(() => rejoinRoomSchema.parse({ ...valid, clientId: '' })).toThrow();
  });

  test('should reject a roomId without the room_ prefix', () => {
    expect(() =>
      rejoinRoomSchema.parse({ ...valid, roomId: 'invalid' }),
    ).toThrow();
  });
});

// ─── validateSocketData ──────────────────────────────────────────────────────

describe('validateSocketData', () => {
  test('should return parsed data when the payload is valid', () => {
    const result = validateSocketData(roomIdSchema, { roomId: 'room_abc' });
    expect(result).toEqual({ roomId: 'room_abc' });
  });

  test('should throw a GameError when the payload is invalid', () => {
    expect(() => validateSocketData(roomIdSchema, { roomId: 'bad' })).toThrow(
      GameError,
    );
  });

  test('should set INVALID_DATA as the error code', () => {
    try {
      validateSocketData(roomIdSchema, { roomId: 'bad' });
    } catch (err) {
      expect((err as GameError).code).toBe('INVALID_DATA');
    }
  });

  test('should throw when required fields are missing', () => {
    expect(() => validateSocketData(roomIdSchema, {})).toThrow(GameError);
  });

  test('should throw when the payload is null', () => {
    expect(() => validateSocketData(roomIdSchema, null)).toThrow(GameError);
  });
});

// ─── validateRoomExists ──────────────────────────────────────────────────────

describe('validateRoomExists', () => {
  test('should not throw when the room exists', () => {
    const room = { id: 'room_1' } as Room;
    expect(() => validateRoomExists(room, 'room_1')).not.toThrow();
  });

  test('should throw GameError with ROOM_NOT_FOUND code when room is undefined', () => {
    expect.assertions(2);
    try {
      validateRoomExists(undefined, 'room_missing');
    } catch (err) {
      expect((err as GameError).code).toBe('ROOM_NOT_FOUND');
      expect((err as GameError).message).toContain('room_missing');
    }
  });
});

// ─── validateGameStarted ─────────────────────────────────────────────────────

describe('validateGameStarted', () => {
  test('should not throw when game has started', () => {
    expect(() => validateGameStarted(true)).not.toThrow();
  });

  test('should throw GameError with GAME_NOT_STARTED code when game has not started', () => {
    expect.assertions(1);
    try {
      validateGameStarted(false);
    } catch (err) {
      expect((err as GameError).code).toBe('GAME_NOT_STARTED');
    }
  });
});

// ─── validateGameNotOver ─────────────────────────────────────────────────────

describe('validateGameNotOver', () => {
  test('should not throw when there is no winner', () => {
    expect(() => validateGameNotOver(null)).not.toThrow();
  });

  test('should throw GameError with GAME_OVER code when a winner exists', () => {
    expect.assertions(1);
    try {
      validateGameNotOver('player-1');
    } catch (err) {
      expect((err as GameError).code).toBe('GAME_OVER');
    }
  });
});

// ─── validatePlayerTurn ──────────────────────────────────────────────────────

describe('validatePlayerTurn', () => {
  test("should not throw when it is the player's turn", () => {
    expect(() => validatePlayerTurn('player-1', 'player-1')).not.toThrow();
  });

  test("should throw GameError with NOT_YOUR_TURN code when it is not the player's turn", () => {
    expect.assertions(1);
    try {
      validatePlayerTurn('player-2', 'player-1');
    } catch (err) {
      expect((err as GameError).code).toBe('NOT_YOUR_TURN');
    }
  });

  test('should throw when currentTurn is null', () => {
    expect.assertions(1);
    try {
      validatePlayerTurn(null, 'player-1');
    } catch (err) {
      expect((err as GameError).code).toBe('NOT_YOUR_TURN');
    }
  });
});

// ─── validateIsHost ──────────────────────────────────────────────────────────

describe('validateIsHost', () => {
  test('should not throw when the player is the host', () => {
    expect(() => validateIsHost('host-id', 'host-id')).not.toThrow();
  });

  test('should throw GameError with NOT_HOST code when the player is not the host', () => {
    expect.assertions(1);
    try {
      validateIsHost('host-id', 'other-player');
    } catch (err) {
      expect((err as GameError).code).toBe('NOT_HOST');
    }
  });
});

// ─── validateRoomNotFull ─────────────────────────────────────────────────────

describe('validateRoomNotFull', () => {
  test('should not throw when the room has space', () => {
    expect(() => validateRoomNotFull(3, 4)).not.toThrow();
  });

  test('should not throw when the room is empty', () => {
    expect(() => validateRoomNotFull(0, 4)).not.toThrow();
  });

  test('should throw GameError with ROOM_FULL code when room is at capacity', () => {
    expect.assertions(1);
    try {
      validateRoomNotFull(4, 4);
    } catch (err) {
      expect((err as GameError).code).toBe('ROOM_FULL');
    }
  });

  test('should throw when player count exceeds max (defensive)', () => {
    expect.assertions(1);
    try {
      validateRoomNotFull(5, 4);
    } catch (err) {
      expect((err as GameError).code).toBe('ROOM_FULL');
    }
  });
});

// ─── validateMinimumPlayers ──────────────────────────────────────────────────

describe('validateMinimumPlayers', () => {
  test('should not throw when player count meets the default minimum of 2', () => {
    expect(() => validateMinimumPlayers(2)).not.toThrow();
    expect(() => validateMinimumPlayers(4)).not.toThrow();
  });

  test('should throw GameError with INSUFFICIENT_PLAYERS code when below default minimum', () => {
    expect.assertions(1);
    try {
      validateMinimumPlayers(1);
    } catch (err) {
      expect((err as GameError).code).toBe('INSUFFICIENT_PLAYERS');
    }
  });

  test('should respect a custom minimum parameter', () => {
    expect(() => validateMinimumPlayers(3, 3)).not.toThrow();
    expect.assertions(2);
    try {
      validateMinimumPlayers(2, 3);
    } catch (err) {
      expect((err as GameError).code).toBe('INSUFFICIENT_PLAYERS');
    }
  });
});
