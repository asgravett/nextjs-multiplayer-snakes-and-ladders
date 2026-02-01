'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, RoomInfo } from '@/lib/types';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/lib/socketEvents';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Type for roll info
interface LastRollInfo {
  playerId: string;
  playerName: string;
  roll: number;
  newPosition: number;
}

// Socket error types for external handling
type SocketErrorType = 'connection' | 'timeout' | 'server' | 'unknown';

interface SocketErrorHandler {
  onError?: (type: SocketErrorType, message: string) => void;
  onReconnect?: () => void;
}

export function useGameSocket(errorHandler?: SocketErrorHandler) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastRollInfo, setLastRollInfo] = useState<LastRollInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const socketRef = useRef<TypedSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const socket: TypedSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
      {
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      },
    );

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setMyId(socket.id || null);
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;

      // Notify successful reconnection
      errorHandler?.onReconnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - don't auto-reconnect
        errorHandler?.onError?.('server', 'Disconnected by server');
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Network issue - socket.io will auto-reconnect
        setIsReconnecting(true);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      reconnectAttempts.current += 1;

      if (reconnectAttempts.current >= maxReconnectAttempts) {
        errorHandler?.onError?.(
          'connection',
          `Failed to connect after ${maxReconnectAttempts} attempts: ${err.message}`,
        );
      } else {
        setIsReconnecting(true);
      }
    });

    socket.io.on('reconnect', (attempt) => {
      console.log('Reconnected after', attempt, 'attempts');
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
      errorHandler?.onReconnect?.();
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log('Reconnection attempt:', attempt);
      setIsReconnecting(true);
    });

    socket.io.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setIsReconnecting(false);
      errorHandler?.onError?.('connection', 'Failed to reconnect to server');
    });

    // Game events
    socket.on('roomsList', (rooms) => {
      setAvailableRooms(rooms);
    });

    socket.on('roomJoined', (data) => {
      setCurrentRoomId(data.roomId);
      setIsHost(data.room.host === socket.id);
      setGameState(data.room.gameState);
    });

    socket.on('gameState', (data) => {
      setGameState((prevState) => {
        if (prevState) {
          setLastRollInfo((prevRoll) => {
            if (prevRoll && data.players[prevRoll.playerId]) {
              return {
                ...prevRoll,
                playerName: data.players[prevRoll.playerId].name,
              };
            }
            return prevRoll;
          });
        }
        return data;
      });
      setError(null);
    });

    socket.on('diceRolled', (data) => {
      setLastRollInfo({
        playerId: data.playerId,
        playerName: '',
        roll: data.roll,
        newPosition: data.newPosition,
      });

      setTimeout(() => setLastRollInfo(null), 3000);
    });

    socket.on('gameWon', (data) => {
      console.log(`${data.winner} wins!`);
    });

    socket.on('gameReset', () => {
      setLastRollInfo(null);
      setError(null);
    });

    socket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // Handle room left (kicked, room closed, etc.)
    socket.on('roomLeft', () => {
      setCurrentRoomId(null);
      setGameState(null);
      setIsHost(false);
      setLastRollInfo(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('roomsList');
      socket.off('roomJoined');
      socket.off('gameState');
      socket.off('diceRolled');
      socket.off('gameWon');
      socket.off('gameReset');
      socket.off('error');
      socket.off('roomLeft');
      socket.io.off('reconnect');
      socket.io.off('reconnect_attempt');
      socket.io.off('reconnect_failed');
      socket.disconnect();
    };
  }, [errorHandler]);

  const createRoom = useCallback((roomName: string, playerName: string) => {
    socketRef.current?.emit('createRoom', { roomName, playerName });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    socketRef.current?.emit('joinRoom', { roomId, playerName });
  }, []);

  const startGame = useCallback(() => {
    if (currentRoomId) {
      socketRef.current?.emit('startGame', { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const rollDice = useCallback(() => {
    if (currentRoomId) {
      socketRef.current?.emit('rollDice', { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const resetGame = useCallback(() => {
    if (currentRoomId) {
      socketRef.current?.emit('resetGame', { roomId: currentRoomId });
    }
  }, [currentRoomId]);

  const leaveRoom = useCallback(() => {
    if (currentRoomId) {
      socketRef.current?.emit('leaveRoom', { roomId: currentRoomId });
      setCurrentRoomId(null);
      setGameState(null);
      setIsHost(false);
      setLastRollInfo(null);
    }
  }, [currentRoomId]);

  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      reconnectAttempts.current = 0;
      socketRef.current.connect();
    }
  }, []);

  const isMyTurn = gameState?.currentTurn === myId;

  return {
    gameState,
    rollDice,
    resetGame,
    isMyTurn,
    lastRollInfo,
    error,
    myId,
    currentRoomId,
    availableRooms,
    isHost,
    isConnected,
    isReconnecting,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    reconnect,
  };
}

export type { LastRollInfo, SocketErrorType, SocketErrorHandler };
