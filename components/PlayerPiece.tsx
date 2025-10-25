'use client';

import { getXYFromSquare } from '@/lib/logic';

export default function PlayerPiece({
  position,
  color = 'red',
}: {
  position: number;
  color?: string;
}) {
  const { x, y } = getXYFromSquare(position);
  return (
    <div
      className="absolute transition-transform duration-500"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
      role="img"
      aria-label={`Player at square ${position}`}
    >
      <div
        className={`w-5 h-5 rounded-full`}
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
