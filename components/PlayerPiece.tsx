'use client';

import { getXYFromSquare } from '@/lib/logic';

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

  const colorMap: Record<string, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
  };

  return (
    <div
      className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ease-in-out"
      style={{
        left: `${x + offset.x}px`,
        top: `${y + offset.y}px`,
        backgroundColor: colorMap[color] || color,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    />
  );
}
