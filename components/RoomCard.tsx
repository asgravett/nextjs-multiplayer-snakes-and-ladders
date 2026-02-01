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
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors">
      <div>
        <h4 className="font-semibold text-gray-800">{room.name}</h4>
        <p className="text-sm text-gray-500">
          {room.playerCount}/{room.maxPlayers} players
        </p>
      </div>
      <Button onClick={onJoin} disabled={disabled} size="sm" variant="primary">
        Join
      </Button>
    </div>
  );
}
