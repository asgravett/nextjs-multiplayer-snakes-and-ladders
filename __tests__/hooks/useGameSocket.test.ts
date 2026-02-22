// Mock socket.io-client BEFORE any imports that pull in the hook.
const mockSocketIo = {
  on: jest.fn(),
  off: jest.fn(),
};

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  connected: false,
  id: 'socket-test-id',
  io: mockSocketIo,
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

import { renderHook, act } from '@testing-library/react';
import { useGameSocket } from '@/hooks/useGameSocket';
import type { GameState, RoomInfo } from '@/lib/types';

// Helper: get the callback registered for a specific socket event name.
function getSocketHandler(
  eventName: string,
): ((...args: unknown[]) => void) | undefined {
  const call = mockSocket.on.mock.calls.find(([name]) => name === eventName);
  return call ? call[1] : undefined;
}

const mockGameState: GameState = {
  players: {
    'socket-test-id': {
      id: 'socket-test-id',
      position: 1,
      name: 'Alice',
      clientId: 'client-1',
    },
  },
  currentTurn: 'socket-test-id',
  playerOrder: ['socket-test-id'],
  winner: null,
  gameStarted: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockSocket.id = 'socket-test-id';
  mockSocket.connected = false;
});

// ─── initial state ───────────────────────────────────────────────────────────

describe('useGameSocket - initial state', () => {
  test('should initialise with all fields in their default disconnected values', () => {
    const { result } = renderHook(() => useGameSocket());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.gameState).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.currentRoomId).toBeNull();
    expect(result.current.availableRooms).toEqual([]);
    expect(result.current.isHost).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.lastRollInfo).toBeNull();
    expect(result.current.myId).toBeNull();
  });

  test('should expose all required callback functions', () => {
    const { result } = renderHook(() => useGameSocket());

    expect(typeof result.current.createRoom).toBe('function');
    expect(typeof result.current.joinRoom).toBe('function');
    expect(typeof result.current.startGame).toBe('function');
    expect(typeof result.current.rollDice).toBe('function');
    expect(typeof result.current.resetGame).toBe('function');
    expect(typeof result.current.leaveRoom).toBe('function');
    expect(typeof result.current.reconnect).toBe('function');
  });

  test('isMyTurn should be false when there is no game state', () => {
    const { result } = renderHook(() => useGameSocket());
    expect(result.current.isMyTurn).toBe(false);
  });
});

// ─── localStorage / clientId ─────────────────────────────────────────────────

describe('useGameSocket - localStorage clientId', () => {
  test('should create and persist a new clientId when none is stored', () => {
    expect(localStorage.getItem('snl_client_id')).toBeNull();

    renderHook(() => useGameSocket());

    const stored = localStorage.getItem('snl_client_id');
    expect(stored).not.toBeNull();
    expect(stored).toMatch(/^client_/);
  });

  test('should reuse an existing clientId from localStorage', () => {
    localStorage.setItem('snl_client_id', 'client_existing_abc');

    const { result } = renderHook(() => useGameSocket());

    act(() => {
      result.current.createRoom('My Room', 'Alice');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'createRoom',
      expect.objectContaining({ clientId: 'client_existing_abc' }),
    );
  });

  test('should not regenerate clientId between hook re-renders', () => {
    renderHook(() => useGameSocket());
    const first = localStorage.getItem('snl_client_id');

    renderHook(() => useGameSocket());
    const second = localStorage.getItem('snl_client_id');

    expect(first).toBe(second);
  });
});

// ─── socket event listener registration ─────────────────────────────────────

describe('useGameSocket - event listener registration', () => {
  test('should register all required socket event listeners on mount', () => {
    renderHook(() => useGameSocket());

    const registeredEvents = mockSocket.on.mock.calls.map(([name]) => name);

    expect(registeredEvents).toContain('connect');
    expect(registeredEvents).toContain('disconnect');
    expect(registeredEvents).toContain('connect_error');
    expect(registeredEvents).toContain('gameState');
    expect(registeredEvents).toContain('roomJoined');
    expect(registeredEvents).toContain('roomsList');
    expect(registeredEvents).toContain('diceRolled');
    expect(registeredEvents).toContain('gameWon');
    expect(registeredEvents).toContain('gameReset');
    expect(registeredEvents).toContain('error');
    expect(registeredEvents).toContain('roomLeft');
    expect(registeredEvents).toContain('hostChanged');
    expect(registeredEvents).toContain('rejoinFailed');
  });

  test('should deregister all event listeners on unmount', () => {
    const { unmount } = renderHook(() => useGameSocket());
    unmount();

    const deregisteredEvents = mockSocket.off.mock.calls.map(([name]) => name);

    expect(deregisteredEvents).toContain('connect');
    expect(deregisteredEvents).toContain('disconnect');
    expect(deregisteredEvents).toContain('connect_error');
    expect(deregisteredEvents).toContain('gameState');
    expect(deregisteredEvents).toContain('roomJoined');
    expect(deregisteredEvents).toContain('roomsList');
    expect(deregisteredEvents).toContain('diceRolled');
    expect(deregisteredEvents).toContain('gameWon');
    expect(deregisteredEvents).toContain('gameReset');
    expect(deregisteredEvents).toContain('error');
    expect(deregisteredEvents).toContain('roomLeft');
    expect(deregisteredEvents).toContain('hostChanged');
    expect(deregisteredEvents).toContain('rejoinFailed');
  });

  test('should call socket.disconnect on unmount', () => {
    const { unmount } = renderHook(() => useGameSocket());
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});

// ─── react to server events ──────────────────────────────────────────────────

describe('useGameSocket - react to server events', () => {
  test('should set isConnected to true when the connect event fires', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('connect')?.();
    });

    expect(result.current.isConnected).toBe(true);
  });

  test('should set myId from socket.id when connect fires', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('connect')?.();
    });

    expect(result.current.myId).toBe('socket-test-id');
  });

  test('should set isConnected to false when the disconnect event fires', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('connect')?.();
      getSocketHandler('disconnect')?.('transport close');
    });

    expect(result.current.isConnected).toBe(false);
  });

  test('should update availableRooms when roomsList event fires', () => {
    const { result } = renderHook(() => useGameSocket());
    const rooms: RoomInfo[] = [
      {
        id: 'room_1',
        name: 'Room 1',
        playerCount: 1,
        maxPlayers: 4,
        gameStarted: false,
      },
    ];

    act(() => {
      getSocketHandler('roomsList')?.(rooms);
    });

    expect(result.current.availableRooms).toEqual(rooms);
  });

  test('should update currentRoomId when roomJoined event fires', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('roomJoined')?.({
        roomId: 'room_abc',
        room: {
          id: 'room_abc',
          name: 'Test',
          host: 'other-socket',
          maxPlayers: 4,
          gameState: mockGameState,
        },
      });
    });

    expect(result.current.currentRoomId).toBe('room_abc');
  });

  test('should set isHost to true when roomJoined fires and socket is the host', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('connect')?.();
      getSocketHandler('roomJoined')?.({
        roomId: 'room_abc',
        room: {
          id: 'room_abc',
          name: 'Test',
          host: 'socket-test-id',
          maxPlayers: 4,
          gameState: mockGameState,
        },
      });
    });

    expect(result.current.isHost).toBe(true);
  });

  test('should update gameState when gameState event fires', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('gameState')?.(mockGameState);
    });

    expect(result.current.gameState).toEqual(mockGameState);
  });

  test('should set error when error event fires', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      getSocketHandler('error')?.({ message: 'Not your turn!' });
    });

    expect(result.current.error).toBe('Not your turn!');
  });

  test('should clear room state when roomLeft event fires', () => {
    const { result } = renderHook(() => useGameSocket());

    // Set up some state first
    act(() => {
      getSocketHandler('roomJoined')?.({
        roomId: 'room_abc',
        room: {
          id: 'room_abc',
          name: 'Test',
          host: 'other-socket',
          maxPlayers: 4,
          gameState: mockGameState,
        },
      });
    });

    act(() => {
      getSocketHandler('roomLeft')?.();
    });

    expect(result.current.currentRoomId).toBeNull();
    expect(result.current.gameState).toBeNull();
    expect(result.current.isHost).toBe(false);
  });
});

// ─── emit helpers ────────────────────────────────────────────────────────────

describe('useGameSocket - emit helpers', () => {
  test('createRoom should emit createRoom event with roomName, playerName, and clientId', () => {
    localStorage.setItem('snl_client_id', 'client_abc');
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      result.current.createRoom('My Room', 'Alice');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('createRoom', {
      roomName: 'My Room',
      playerName: 'Alice',
      clientId: 'client_abc',
    });
  });

  test('joinRoom should emit joinRoom event with roomId, playerName, and clientId', () => {
    localStorage.setItem('snl_client_id', 'client_abc');
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      result.current.joinRoom('room_xyz', 'Bob');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('joinRoom', {
      roomId: 'room_xyz',
      playerName: 'Bob',
      clientId: 'client_abc',
    });
  });

  test('rollDice should not emit when not in a room', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      result.current.rollDice();
    });

    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      'rollDice',
      expect.anything(),
    );
  });

  test('startGame should not emit when not in a room', () => {
    const { result } = renderHook(() => useGameSocket());

    act(() => {
      result.current.startGame();
    });

    expect(mockSocket.emit).not.toHaveBeenCalledWith(
      'startGame',
      expect.anything(),
    );
  });

  test('reconnect should call socket.connect when not connected', () => {
    const { result } = renderHook(() => useGameSocket());
    mockSocket.connected = false;

    act(() => {
      result.current.reconnect();
    });

    expect(mockSocket.connect).toHaveBeenCalled();
  });
});
