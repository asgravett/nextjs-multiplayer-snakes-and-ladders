'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, RoomInfo } from '@/lib/types';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/lib/socketEvents';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// New type for roll info
interface LastRollInfo {
  playerId: string;
  playerName: string;
  roll: number;
  newPosition: number;
}

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastRollInfo, setLastRollInfo] = useState<LastRollInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    const socket: TypedSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id || null);
    });

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
        // Get player name from the updated game state
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
      // Store full roll info including who rolled
      setLastRollInfo({
        playerId: data.playerId,
        playerName: '', // Will be filled from gameState
        roll: data.roll,
        newPosition: data.newPosition,
      });

      // Clear after 3 seconds
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

    return () => {
      socket.off('connect');
      socket.off('roomsList');
      socket.off('roomJoined');
      socket.off('gameState');
      socket.off('diceRolled');
      socket.off('gameWon');
      socket.off('gameReset');
      socket.off('error');
      socket.disconnect();
    };
  }, []);

  const createRoom = (roomName: string, playerName: string) => {
    socketRef.current?.emit('createRoom', { roomName, playerName });
  };

  const joinRoom = (roomId: string, playerName: string) => {
    socketRef.current?.emit('joinRoom', { roomId, playerName });
  };

  const startGame = () => {
    if (currentRoomId) {
      socketRef.current?.emit('startGame', { roomId: currentRoomId });
    }
  };

  const rollDice = () => {
    if (currentRoomId) {
      socketRef.current?.emit('rollDice', { roomId: currentRoomId });
    }
  };

  const resetGame = () => {
    if (currentRoomId) {
      socketRef.current?.emit('resetGame', { roomId: currentRoomId });
    }
  };

  const leaveRoom = () => {
    if (currentRoomId) {
      socketRef.current?.emit('leaveRoom', { roomId: currentRoomId });
      setCurrentRoomId(null);
      setGameState(null);
      setIsHost(false);
    }
  };

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
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
  };
}

export type { LastRollInfo };
