'use client';

import { PLAYER_COLORS, COLOR_MAP } from '@/lib/constants';

// Extracted PlayerCard component
interface PlayerCardProps {
  name: string;
  isHost: boolean;
  isMe: boolean;
  colorIndex: number;
}

export default function PlayerCard({
  name,
  isHost,
  isMe,
  colorIndex,
}: PlayerCardProps) {
  const colorKey = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
  const colors = COLOR_MAP[colorKey];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
        isMe ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${colors}`}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <span className="font-semibold text-gray-800">
          {name}
          {isMe && <span className="text-blue-500 ml-1">(You)</span>}
        </span>
      </div>
      {isHost && (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
          👑 Host
        </span>
      )}
    </div>
  );
}
