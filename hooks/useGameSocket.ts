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

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id || null);
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
      socket.off('gameState');
      socket.off('diceRolled');
      socket.off('gameWon');
      socket.off('gameReset');
      socket.off('error');
      socket.disconnect();
    };
  }, []);

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    socketRef.current?.emit('rollDice', { roll });
  };

  const resetGame = () => {
    socketRef.current?.emit('resetGame');
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
  };
}
