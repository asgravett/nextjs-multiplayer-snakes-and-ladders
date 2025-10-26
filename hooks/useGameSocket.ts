'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Player = { id: string; position: number; name: string };
type GameState = {
  players: Record<string, Player>;
  currentTurn: string | null;
  playerOrder: string[];
  winner: string | null;
  gameStarted: boolean;
};

type RoomInfo = {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameStarted: boolean;
};

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [isHost, setIsHost] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id || null);
    });

    socket.on('roomsList', (rooms: RoomInfo[]) => {
      setAvailableRooms(rooms);
    });

    socket.on('roomJoined', (data: { roomId: string; room: any }) => {
      setCurrentRoomId(data.roomId);
      setIsHost(data.room.host === socket.id);
      setGameState(data.room.gameState);
    });

    socket.on('gameState', (data: GameState) => {
      setGameState(data);
      setError(null);
    });

    socket.on(
      'diceRolled',
      (data: { playerId: string; roll: number; newPosition: number }) => {
        setLastRoll(data.roll);
        setTimeout(() => setLastRoll(null), 2000);
      }
    );

    socket.on('gameWon', (data: { winner: string; winnerId: string }) => {
      console.log(`${data.winner} wins!`);
    });

    socket.on('gameReset', () => {
      setLastRoll(null);
      setError(null);
    });

    socket.on('error', (data: { message: string }) => {
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
    lastRoll,
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
