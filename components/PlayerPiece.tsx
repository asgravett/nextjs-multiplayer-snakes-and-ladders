'use client';

import { getXYFromSquare } from '@/lib/logic';
import { COLOR_MAP } from '@/lib/constants';

export default function PlayerPiece({
  position,
  color,
  offset = { x: 0, y: 0 },
}: {
  position: number;
  color: string;
  offset?: { x: number; y: number };
}) {
  const { x, y } = getXYFromSquare(position);

  return (
    <div
      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ease-in-out"
      style={{
        left: `${x + offset.x}px`,
        top: `${y + offset.y}px`,
        backgroundColor: COLOR_MAP[color] || color,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    />
  );
}
