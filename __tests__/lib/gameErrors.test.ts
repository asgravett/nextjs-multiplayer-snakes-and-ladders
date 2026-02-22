import { GameError, GameErrors } from '@/lib/gameErrors';

// ─── GameError class ─────────────────────────────────────────────────────────

describe('GameError', () => {
  test('should extend the built-in Error class', () => {
    const err = new GameError('test message', 'TEST_CODE');
    expect(err).toBeInstanceOf(Error);
  });

  test('should set message and code correctly', () => {
    const err = new GameError('something went wrong', 'MY_CODE');
    expect(err.message).toBe('something went wrong');
    expect(err.code).toBe('MY_CODE');
  });

  test('should have name property set to "GameError"', () => {
    const err = new GameError('msg', 'CODE');
    expect(err.name).toBe('GameError');
  });

  test('should be catchable as a standard Error', () => {
    const throwIt = () => {
      throw new GameError('oops', 'OOPS');
    };
    expect(throwIt).toThrow(Error);
    expect(throwIt).toThrow('oops');
  });
});

// ─── GameErrors factory methods ──────────────────────────────────────────────

describe('GameErrors', () => {
  describe('all factories return GameError instances', () => {
    test('each factory produces a GameError', () => {
      expect(GameErrors.ROOM_NOT_FOUND('x')).toBeInstanceOf(GameError);
      expect(GameErrors.ROOM_FULL()).toBeInstanceOf(GameError);
      expect(GameErrors.ROOM_EMPTY()).toBeInstanceOf(GameError);
      expect(GameErrors.GAME_ALREADY_STARTED()).toBeInstanceOf(GameError);
      expect(GameErrors.GAME_NOT_STARTED()).toBeInstanceOf(GameError);
      expect(GameErrors.GAME_OVER()).toBeInstanceOf(GameError);
      expect(GameErrors.NOT_YOUR_TURN()).toBeInstanceOf(GameError);
      expect(GameErrors.NOT_HOST('msg')).toBeInstanceOf(GameError);
      expect(GameErrors.INSUFFICIENT_PLAYERS('msg')).toBeInstanceOf(GameError);
      expect(GameErrors.PLAYER_NOT_FOUND('x')).toBeInstanceOf(GameError);
      expect(GameErrors.INVALID_DATA('field')).toBeInstanceOf(GameError);
      expect(GameErrors.INVALID_ROOM_NAME()).toBeInstanceOf(GameError);
      expect(GameErrors.INVALID_PLAYER_NAME()).toBeInstanceOf(GameError);
      expect(GameErrors.INVALID_ROOM_ID()).toBeInstanceOf(GameError);
    });
  });

  describe('ROOM_NOT_FOUND', () => {
    test('should include the room id in the message', () => {
      const err = GameErrors.ROOM_NOT_FOUND('room_abc');
      expect(err.message).toContain('room_abc');
    });

    test('should have code ROOM_NOT_FOUND', () => {
      expect(GameErrors.ROOM_NOT_FOUND('x').code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('ROOM_FULL', () => {
    test('should have code ROOM_FULL', () => {
      expect(GameErrors.ROOM_FULL().code).toBe('ROOM_FULL');
    });
  });

  describe('ROOM_EMPTY', () => {
    test('should have code ROOM_EMPTY', () => {
      expect(GameErrors.ROOM_EMPTY().code).toBe('ROOM_EMPTY');
    });
  });

  describe('GAME_ALREADY_STARTED', () => {
    test('should have code GAME_ALREADY_STARTED', () => {
      expect(GameErrors.GAME_ALREADY_STARTED().code).toBe(
        'GAME_ALREADY_STARTED',
      );
    });
  });

  describe('GAME_NOT_STARTED', () => {
    test('should have code GAME_NOT_STARTED', () => {
      expect(GameErrors.GAME_NOT_STARTED().code).toBe('GAME_NOT_STARTED');
    });
  });

  describe('GAME_OVER', () => {
    test('should have code GAME_OVER', () => {
      expect(GameErrors.GAME_OVER().code).toBe('GAME_OVER');
    });
  });

  describe('NOT_YOUR_TURN', () => {
    test('should have code NOT_YOUR_TURN', () => {
      expect(GameErrors.NOT_YOUR_TURN().code).toBe('NOT_YOUR_TURN');
    });
  });

  describe('NOT_HOST', () => {
    test('should use the provided message verbatim', () => {
      const err = GameErrors.NOT_HOST('Only the host can start the game');
      expect(err.message).toBe('Only the host can start the game');
    });

    test('should have code NOT_HOST', () => {
      expect(GameErrors.NOT_HOST('msg').code).toBe('NOT_HOST');
    });
  });

  describe('INSUFFICIENT_PLAYERS', () => {
    test('should use the provided message verbatim', () => {
      const err = GameErrors.INSUFFICIENT_PLAYERS('Need at least 2 players');
      expect(err.message).toBe('Need at least 2 players');
    });

    test('should have code INSUFFICIENT_PLAYERS', () => {
      expect(GameErrors.INSUFFICIENT_PLAYERS('msg').code).toBe(
        'INSUFFICIENT_PLAYERS',
      );
    });
  });

  describe('PLAYER_NOT_FOUND', () => {
    test('should include the player id in the message', () => {
      const err = GameErrors.PLAYER_NOT_FOUND('socket-abc');
      expect(err.message).toContain('socket-abc');
    });

    test('should have code PLAYER_NOT_FOUND', () => {
      expect(GameErrors.PLAYER_NOT_FOUND('x').code).toBe('PLAYER_NOT_FOUND');
    });
  });

  describe('INVALID_DATA', () => {
    test('should include the field name in the message', () => {
      const err = GameErrors.INVALID_DATA('roomId');
      expect(err.message).toContain('roomId');
    });

    test('should have code INVALID_DATA', () => {
      expect(GameErrors.INVALID_DATA('field').code).toBe('INVALID_DATA');
    });
  });

  describe('INVALID_ROOM_NAME', () => {
    test('should have code INVALID_ROOM_NAME', () => {
      expect(GameErrors.INVALID_ROOM_NAME().code).toBe('INVALID_ROOM_NAME');
    });
  });

  describe('INVALID_PLAYER_NAME', () => {
    test('should have code INVALID_PLAYER_NAME', () => {
      expect(GameErrors.INVALID_PLAYER_NAME().code).toBe('INVALID_PLAYER_NAME');
    });
  });

  describe('INVALID_ROOM_ID', () => {
    test('should have code INVALID_ROOM_ID', () => {
      expect(GameErrors.INVALID_ROOM_ID().code).toBe('INVALID_ROOM_ID');
    });
  });

  describe('error payload safety', () => {
    test('every factory produces a defined, non-empty string code', () => {
      const allErrors = [
        GameErrors.ROOM_NOT_FOUND('x'),
        GameErrors.ROOM_FULL(),
        GameErrors.ROOM_EMPTY(),
        GameErrors.GAME_ALREADY_STARTED(),
        GameErrors.GAME_NOT_STARTED(),
        GameErrors.GAME_OVER(),
        GameErrors.NOT_YOUR_TURN(),
        GameErrors.NOT_HOST('msg'),
        GameErrors.INSUFFICIENT_PLAYERS('msg'),
        GameErrors.PLAYER_NOT_FOUND('x'),
        GameErrors.INVALID_DATA('field'),
        GameErrors.INVALID_ROOM_NAME(),
        GameErrors.INVALID_PLAYER_NAME(),
        GameErrors.INVALID_ROOM_ID(),
      ];

      allErrors.forEach((err) => {
        expect(err.code).toBeDefined();
        expect(typeof err.code).toBe('string');
        expect(err.code.length).toBeGreaterThan(0);
        expect(err.message).toBeDefined();
      });
    });
  });
});
