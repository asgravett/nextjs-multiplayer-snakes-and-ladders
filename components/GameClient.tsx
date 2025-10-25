'use client';

import PlayerPiece from '@/components/PlayerPiece';
import DiceRoller from '@/components/DiceRoller';
import { useGameSocket } from '@/hooks/useGameSocket';

export default function GameClient() {
  const { players, rollDice } = useGameSocket();

  return (
    <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none">
      {Object.values(players).map((p, i) => (
        <PlayerPiece
          key={p.id}
          position={p.position}
          color={['red', 'blue', 'green', 'yellow'][i % 4]}
        />
      ))}
      <div className="pointer-events-auto">
        <DiceRoller onRoll={rollDice} />
      </div>
    </div>
  );
}
