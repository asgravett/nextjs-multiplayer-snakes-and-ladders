import { RoomManager } from '@/server/roomManager';
import { GAME_CONFIG } from '@/lib/constants';
import type { GameState } from '@/lib/types';

// ─── Mock Redis ──────────────────────────────────────────────────────────────
// Replace the real Redis client with an in-memory Map so tests stay fast and
// don't require a running Redis instance.

const store = new Map<string, string>();

jest.mock('@/server/redis', () => ({
  pubClient: {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      const had = store.has(key);
      store.delete(key);
      return had ? 1 : 0;
    }),
    keys: jest.fn(async (pattern: string) => {
      const prefix = pattern.replace('*', '');
      return Array.from(store.keys()).filter((k) => k.startsWith(prefix));
    }),
    mGet: jest.fn(async (keys: string[]) =>
      keys.map((k) => store.get(k) ?? null),
    ),
  },
}));

// Each test uses a fresh RoomManager instance so there is no shared state.
function makeManager() {
  store.clear();
  return new RoomManager();
}

// ─── create ──────────────────────────────────────────────────────────────────

describe('RoomManager - create', () => {
  test('should create a room with the correct initial shape', async () => {
    const rm = makeManager();
    const room = await rm.create('room_1', 'Test Room', 'host-123');

    expect(room.id).toBe('room_1');
    expect(room.name).toBe('Test Room');
    expect(room.host).toBe('host-123');
    expect(room.maxPlayers).toBe(GAME_CONFIG.MAX_PLAYERS);
    expect(room.gameState.gameStarted).toBe(false);
    expect(room.gameState.winner).toBeNull();
    expect(room.gameState.currentTurn).toBeNull();
    expect(room.gameState.players).toEqual({});
    expect(room.gameState.playerOrder).toEqual([]);
  });

  test('should store the room so that get() can retrieve it', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test Room', 'host-123');
    expect(await rm.get('room_1')).toBeDefined();
  });

  test('should create multiple rooms independently', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Room One', 'host-1');
    await rm.create('room_2', 'Room Two', 'host-2');
    expect((await rm.get('room_1'))!.name).toBe('Room One');
    expect((await rm.get('room_2'))!.name).toBe('Room Two');
  });
});

// ─── get ─────────────────────────────────────────────────────────────────────

describe('RoomManager - get', () => {
  test('should return the room when it exists', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'host-1');
    expect(await rm.get('room_1')).not.toBeUndefined();
  });

  test('should return undefined for a non-existent room', async () => {
    const rm = makeManager();
    expect(await rm.get('room_missing')).toBeUndefined();
  });
});

// ─── delete ──────────────────────────────────────────────────────────────────

describe('RoomManager - delete', () => {
  test('should return true and remove the room when it exists', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'host-1');
    expect(await rm.delete('room_1')).toBe(true);
    expect(await rm.get('room_1')).toBeUndefined();
  });

  test('should return false when trying to delete a non-existent room', async () => {
    const rm = makeManager();
    expect(await rm.delete('room_missing')).toBe(false);
  });
});

// ─── getAll ──────────────────────────────────────────────────────────────────

describe('RoomManager - getAll', () => {
  test('should return an empty array when no rooms exist', async () => {
    const rm = makeManager();
    expect(await rm.getAll()).toEqual([]);
  });

  test('should return all created rooms', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Room 1', 'host-1');
    await rm.create('room_2', 'Room 2', 'host-2');
    expect(await rm.getAll()).toHaveLength(2);
  });
});

// ─── getRoomsInfo ────────────────────────────────────────────────────────────

describe('RoomManager - getRoomsInfo', () => {
  test('should return an array of correctly shaped room info objects', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'My Room', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const info = await rm.getRoomsInfo();

    expect(info).toHaveLength(1);
    expect(info[0]).toEqual({
      id: 'room_1',
      name: 'My Room',
      playerCount: 1,
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      gameStarted: false,
    });
  });

  test('should reflect the correct player count after adding players', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'My Room', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    expect((await rm.getRoomsInfo())[0].playerCount).toBe(2);
  });
});

// ─── addPlayer ───────────────────────────────────────────────────────────────

describe('RoomManager - addPlayer', () => {
  test('should add a player with the correct starting state', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const player = (await rm.get('room_1'))!.gameState.players['socket-1'];
    expect(player).toEqual({
      id: 'socket-1',
      position: GAME_CONFIG.STARTING_POSITION,
      name: 'Alice',
      clientId: 'client-1',
    });
  });

  test('should append the player to playerOrder', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    expect((await rm.get('room_1'))!.gameState.playerOrder).toContain(
      'socket-1',
    );
  });

  test('should maintain insertion order when multiple players join', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    expect((await rm.get('room_1'))!.gameState.playerOrder).toEqual([
      'socket-1',
      'socket-2',
    ]);
  });

  test('should do nothing silently when the room does not exist', async () => {
    const rm = makeManager();
    await expect(
      rm.addPlayer('room_missing', 'socket-1', 'Alice', 'client-1'),
    ).resolves.not.toThrow();
  });
});

// ─── removePlayer ────────────────────────────────────────────────────────────

describe('RoomManager - removePlayer', () => {
  test('should return true and destroy the room when the last player leaves', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const roomDeleted = await rm.removePlayer('room_1', 'socket-1');

    expect(roomDeleted).toBe(true);
    expect(await rm.get('room_1')).toBeUndefined();
  });

  test('should return false and keep the room when other players remain', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    const roomDeleted = await rm.removePlayer('room_1', 'socket-1');

    expect(roomDeleted).toBe(false);
    expect(await rm.get('room_1')).toBeDefined();
    expect(
      (await rm.get('room_1'))!.gameState.players['socket-1'],
    ).toBeUndefined();
  });

  test('should remove the player from playerOrder', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');
    await rm.removePlayer('room_1', 'socket-1');

    expect((await rm.get('room_1'))!.gameState.playerOrder).not.toContain(
      'socket-1',
    );
  });

  test('should transfer host to the next player when the host leaves', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    await rm.removePlayer('room_1', 'socket-1');

    expect((await rm.get('room_1'))!.host).toBe('socket-2');
  });

  test('should advance currentTurn when the active turn player leaves', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    const room = (await rm.get('room_1'))!;
    room.gameState.gameStarted = true;
    room.gameState.currentTurn = 'socket-1';
    await rm.save(room);

    await rm.removePlayer('room_1', 'socket-1');

    expect((await rm.get('room_1'))!.gameState.currentTurn).toBe('socket-2');
  });

  test('should return false when the room does not exist', async () => {
    const rm = makeManager();
    expect(await rm.removePlayer('room_missing', 'socket-1')).toBe(false);
  });
});

// ─── getNextTurn ─────────────────────────────────────────────────────────────

describe('RoomManager - getNextTurn', () => {
  function stateWithTwoPlayers(): GameState {
    return {
      players: {
        'socket-1': {
          id: 'socket-1',
          position: 1,
          name: 'Alice',
          clientId: 'c1',
        },
        'socket-2': {
          id: 'socket-2',
          position: 1,
          name: 'Bob',
          clientId: 'c2',
        },
      },
      currentTurn: 'socket-1',
      playerOrder: ['socket-1', 'socket-2'],
      winner: null,
      gameStarted: true,
    };
  }

  test('should advance to the next player in order', () => {
    const rm = makeManager();
    const gs = stateWithTwoPlayers();
    expect(rm.getNextTurn(gs)).toBe('socket-2');
  });

  test('should wrap around to the first player after the last player', () => {
    const rm = makeManager();
    const gs = stateWithTwoPlayers();
    gs.currentTurn = 'socket-2';
    expect(rm.getNextTurn(gs)).toBe('socket-1');
  });

  test('should skip disconnected players', () => {
    const rm = makeManager();
    const gs = stateWithTwoPlayers();
    gs.players['socket-3'] = {
      id: 'socket-3',
      position: 1,
      name: 'Charlie',
      clientId: 'c3',
    };
    gs.playerOrder = ['socket-1', 'socket-2', 'socket-3'];
    gs.currentTurn = 'socket-1';
    gs.players['socket-2'].disconnected = true;

    expect(rm.getNextTurn(gs)).toBe('socket-3');
  });

  test('should return null when all players are disconnected', () => {
    const rm = makeManager();
    const gs = stateWithTwoPlayers();
    gs.players['socket-1'].disconnected = true;
    gs.players['socket-2'].disconnected = true;

    expect(rm.getNextTurn(gs)).toBeNull();
  });

  test('should return the only active player when called from their own turn', () => {
    const rm = makeManager();
    const gs = stateWithTwoPlayers();
    gs.players['socket-2'].disconnected = true;
    gs.currentTurn = 'socket-1';

    // Only socket-1 is active; next should wrap back to socket-1
    expect(rm.getNextTurn(gs)).toBe('socket-1');
  });
});

// ─── getNextActiveTurn ───────────────────────────────────────────────────────

describe('RoomManager - getNextActiveTurn', () => {
  function stateWithThreePlayers(): GameState {
    return {
      players: {
        'socket-1': {
          id: 'socket-1',
          position: 1,
          name: 'Alice',
          clientId: 'c1',
        },
        'socket-2': {
          id: 'socket-2',
          position: 1,
          name: 'Bob',
          clientId: 'c2',
        },
        'socket-3': {
          id: 'socket-3',
          position: 1,
          name: 'Charlie',
          clientId: 'c3',
        },
      },
      currentTurn: 'socket-1',
      playerOrder: ['socket-1', 'socket-2', 'socket-3'],
      winner: null,
      gameStarted: true,
    };
  }

  test('should return the next connected player after the given player', () => {
    const rm = makeManager();
    expect(rm.getNextActiveTurn(stateWithThreePlayers(), 'socket-1')).toBe(
      'socket-2',
    );
  });

  test('should skip over disconnected players', () => {
    const rm = makeManager();
    const gs = stateWithThreePlayers();
    gs.players['socket-2'].disconnected = true;

    expect(rm.getNextActiveTurn(gs, 'socket-1')).toBe('socket-3');
  });

  test('should return null when no other active players remain', () => {
    const rm = makeManager();
    const gs = stateWithThreePlayers();
    gs.players['socket-2'].disconnected = true;
    gs.players['socket-3'].disconnected = true;
    // socket-1 is also being "disconnected" - mark it so all are inactive
    gs.players['socket-1'].disconnected = true;

    expect(rm.getNextActiveTurn(gs, 'socket-1')).toBeNull();
  });

  test('should return null when the given player ID is not in the order', () => {
    const rm = makeManager();
    expect(
      rm.getNextActiveTurn(stateWithThreePlayers(), 'socket-unknown'),
    ).toBeNull();
  });
});

// ─── markPlayerDisconnected ──────────────────────────────────────────────────

describe('RoomManager - markPlayerDisconnected', () => {
  test('should set the disconnected flag on the player', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    await rm.markPlayerDisconnected('room_1', 'socket-1');

    expect(
      (await rm.get('room_1'))!.gameState.players['socket-1'].disconnected,
    ).toBe(true);
  });

  test('should not throw when the room does not exist', async () => {
    const rm = makeManager();
    await expect(
      rm.markPlayerDisconnected('room_missing', 'socket-1'),
    ).resolves.not.toThrow();
  });

  test('should not throw when the player does not exist in the room', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await expect(
      rm.markPlayerDisconnected('room_1', 'socket-unknown'),
    ).resolves.not.toThrow();
  });
});

// ─── findPlayerByClientId ────────────────────────────────────────────────────

describe('RoomManager - findPlayerByClientId', () => {
  test('should return the player matching the clientId', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const player = await rm.findPlayerByClientId('room_1', 'client-1');

    expect(player).toBeDefined();
    expect(player!.name).toBe('Alice');
    expect(player!.clientId).toBe('client-1');
  });

  test('should return undefined when the clientId is not found', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    expect(
      await rm.findPlayerByClientId('room_1', 'client-missing'),
    ).toBeUndefined();
  });

  test('should return undefined when the room does not exist', async () => {
    const rm = makeManager();
    expect(
      await rm.findPlayerByClientId('room_missing', 'client-1'),
    ).toBeUndefined();
  });

  test('should find the correct player when multiple players are in the room', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    expect((await rm.findPlayerByClientId('room_1', 'client-2'))!.name).toBe(
      'Bob',
    );
  });
});

// ─── reconnectPlayer ─────────────────────────────────────────────────────────

describe('RoomManager - reconnectPlayer', () => {
  test('should remap the player from the old socket ID to the new socket ID', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-old');
    await rm.addPlayer('room_1', 'socket-old', 'Alice', 'client-1');
    await rm.markPlayerDisconnected('room_1', 'socket-old');

    await rm.reconnectPlayer('room_1', 'socket-old', 'socket-new');

    const room = (await rm.get('room_1'))!;
    expect(room.gameState.players['socket-old']).toBeUndefined();
    expect(room.gameState.players['socket-new']).toBeDefined();
  });

  test('should update the player id field to the new socket id', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-old');
    await rm.addPlayer('room_1', 'socket-old', 'Alice', 'client-1');
    await rm.reconnectPlayer('room_1', 'socket-old', 'socket-new');

    expect((await rm.get('room_1'))!.gameState.players['socket-new'].id).toBe(
      'socket-new',
    );
  });

  test('should clear the disconnected flag after reconnect', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-old');
    await rm.addPlayer('room_1', 'socket-old', 'Alice', 'client-1');
    await rm.markPlayerDisconnected('room_1', 'socket-old');
    await rm.reconnectPlayer('room_1', 'socket-old', 'socket-new');

    expect(
      (await rm.get('room_1'))!.gameState.players['socket-new'].disconnected,
    ).toBe(false);
  });

  test('should update playerOrder to reflect the new socket ID', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-old');
    await rm.addPlayer('room_1', 'socket-old', 'Alice', 'client-1');
    await rm.reconnectPlayer('room_1', 'socket-old', 'socket-new');

    const order = (await rm.get('room_1'))!.gameState.playerOrder;
    expect(order).toContain('socket-new');
    expect(order).not.toContain('socket-old');
  });

  test('should update currentTurn when the reconnecting player held the turn', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-old');
    await rm.addPlayer('room_1', 'socket-old', 'Alice', 'client-1');
    const room = (await rm.get('room_1'))!;
    room.gameState.currentTurn = 'socket-old';
    await rm.save(room);

    await rm.reconnectPlayer('room_1', 'socket-old', 'socket-new');

    expect((await rm.get('room_1'))!.gameState.currentTurn).toBe('socket-new');
  });

  test('should not update currentTurn when it belongs to a different player', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-old');
    await rm.addPlayer('room_1', 'socket-old', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');
    const room = (await rm.get('room_1'))!;
    room.gameState.currentTurn = 'socket-2';
    await rm.save(room);

    await rm.reconnectPlayer('room_1', 'socket-old', 'socket-new');

    expect((await rm.get('room_1'))!.gameState.currentTurn).toBe('socket-2');
  });

  test('should restore currentTurn when game is active but turn was null (all players disconnected)', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_1', 'socket-2', 'Bob', 'client-2');

    // Simulate game start then all players disconnecting (currentTurn → null)
    const room = (await rm.get('room_1'))!;
    room.gameState.gameStarted = true;
    room.gameState.currentTurn = null;
    room.gameState.players['socket-1'].disconnected = true;
    room.gameState.players['socket-2'].disconnected = true;
    await rm.save(room);

    // Alice reconnects — currentTurn should be restored to her
    await rm.reconnectPlayer('room_1', 'socket-1', 'socket-new');

    const updated = (await rm.get('room_1'))!;
    expect(updated.gameState.currentTurn).toBe('socket-new');
  });

  test('should not restore currentTurn when game has a winner', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const room = (await rm.get('room_1'))!;
    room.gameState.gameStarted = true;
    room.gameState.currentTurn = null;
    room.gameState.winner = 'socket-1';
    room.gameState.players['socket-1'].disconnected = true;
    await rm.save(room);

    await rm.reconnectPlayer('room_1', 'socket-1', 'socket-new');

    expect((await rm.get('room_1'))!.gameState.currentTurn).toBeNull();
  });

  test('should not restore currentTurn when game has not started', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const room = (await rm.get('room_1'))!;
    room.gameState.gameStarted = false;
    room.gameState.currentTurn = null;
    room.gameState.players['socket-1'].disconnected = true;
    await rm.save(room);

    await rm.reconnectPlayer('room_1', 'socket-1', 'socket-new');

    expect((await rm.get('room_1'))!.gameState.currentTurn).toBeNull();
  });

  test('should not throw when the room does not exist', async () => {
    const rm = makeManager();
    await expect(
      rm.reconnectPlayer('room_missing', 'socket-old', 'socket-new'),
    ).resolves.not.toThrow();
  });
});

// ─── findPlayerRoom ──────────────────────────────────────────────────────────

describe('RoomManager - findPlayerRoom', () => {
  test('should return the room containing the given player', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');

    const room = await rm.findPlayerRoom('socket-1');

    expect(room).toBeDefined();
    expect(room!.id).toBe('room_1');
  });

  test('should return undefined when the player is not in any room', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Test', 'socket-1');

    expect(await rm.findPlayerRoom('socket-missing')).toBeUndefined();
  });

  test('should find the correct room when a player exists in one of several rooms', async () => {
    const rm = makeManager();
    await rm.create('room_1', 'Room 1', 'socket-1');
    await rm.create('room_2', 'Room 2', 'socket-2');
    await rm.addPlayer('room_1', 'socket-1', 'Alice', 'client-1');
    await rm.addPlayer('room_2', 'socket-2', 'Bob', 'client-2');

    expect((await rm.findPlayerRoom('socket-2'))!.id).toBe('room_2');
  });
});
