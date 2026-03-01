'use client';

import { useState } from 'react';
import { RoomInfo } from '@/lib/types';
import { useLocalStorage } from '@/hooks';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  ErrorMessage,
} from '@/components/ui';
import RoomCard from '@/components/RoomCard';

interface LobbyProps {
  rooms: RoomInfo[];
  onCreateRoom: (roomName: string, playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  error: string | null;
}

export default function Lobby({
  rooms,
  onCreateRoom,
  onJoinRoom,
  error,
}: LobbyProps) {
  const [playerName, setPlayerName] = useLocalStorage('snl_player_name', '');
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    if (playerName.trim() && roomName.trim()) {
      onCreateRoom(roomName.trim(), playerName.trim());
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (playerName.trim()) {
      onJoinRoom(roomId, playerName.trim());
    }
  };

  const availableRooms = rooms.filter(
    (room) => !room.gameStarted && room.playerCount < room.maxPlayers,
  );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Player Name Input */}
      <Card variant="elevated">
        <CardHeader
          title="Welcome!"
          subtitle="Enter your name to get started"
          icon={<span className="text-lg">🎮</span>}
        />
        <CardContent>
          <label htmlFor="lobby-player-name" className="sr-only">
            Your name
          </label>
          <input
            id="lobby-player-name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all text-base"
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && <ErrorMessage message={error} variant="error" />}

      {/* Create Room Section */}
      <Card>
        <CardHeader
          title="Create a Room"
          subtitle="Start a new game"
          icon={<span className="text-lg">🏠</span>}
        />
        <CardContent className="space-y-4">
          <label htmlFor="lobby-room-name" className="sr-only">
            Room name
          </label>
          <input
            id="lobby-room-name"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name"
            maxLength={50}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          <Button
            onClick={handleCreateRoom}
            disabled={!playerName.trim() || !roomName.trim()}
            isLoading={isCreating}
            fullWidth
            size="lg"
            leftIcon={<span>➕</span>}
          >
            Create Room
          </Button>
        </CardContent>
      </Card>

      {/* Available Rooms */}
      <Card>
        <CardHeader
          title="Join a Room"
          subtitle={`${availableRooms.length} room${availableRooms.length !== 1 ? 's' : ''} available`}
          icon={<span className="text-lg">🚪</span>}
        />
        <CardContent>
          {availableRooms.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl mb-3 block opacity-60">🏜️</span>
              <p>No rooms available. Create one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinRoom(room.id)}
                  disabled={!playerName.trim()}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
