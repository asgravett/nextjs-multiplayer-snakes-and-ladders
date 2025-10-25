'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Player = { id: string; position: number };

export function useGameSocket() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Create socket only once
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'
    );

    socketRef.current = socket;

    socket.on('updatePositions', (data) => setPlayers(data));

    return () => {
      socket.off('updatePositions');
      socket.disconnect();
    };
  }, []);

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    socketRef.current?.emit('rollDice', { roll });
  };

  return { players, rollDice };
}
