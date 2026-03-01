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
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isMe ? 'border-cyan-500/30 bg-cyan-500/8' : 'border-white/8 bg-white/4'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
        style={{ background: colors }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <span className="font-semibold text-slate-100">
          {name}
          {isMe && <span className="text-cyan-400 ml-1 text-sm">(You)</span>}
        </span>
      </div>
      {isHost && (
        <span className="px-2 py-1 bg-amber-500/15 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/20">
          👑 Host
        </span>
      )}
    </div>
  );
}
