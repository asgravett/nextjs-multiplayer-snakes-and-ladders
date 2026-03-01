'use client';

import { RoomInfo } from '@/lib/types';
import { Button } from '@/components/ui';

// Extracted RoomCard component
interface RoomCardProps {
  room: RoomInfo;
  onJoin: () => void;
  disabled: boolean;
}

export default function RoomCard({ room, onJoin, disabled }: RoomCardProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-cyan-500/20 transition-all duration-200">
      <div>
        <h4 className="font-semibold text-slate-100">{room.name}</h4>
        <p className="text-sm text-slate-500">
          {room.playerCount}/{room.maxPlayers} players
        </p>
      </div>
      <Button onClick={onJoin} disabled={disabled} size="sm" variant="primary">
        Join
      </Button>
    </div>
  );
}
