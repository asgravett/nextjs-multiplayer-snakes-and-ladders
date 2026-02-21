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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Player Name Input */}
      <Card variant="elevated">
        <CardHeader
          title="Welcome!"
          subtitle="Enter your name to get started"
          icon={<span className="text-2xl">🎮</span>}
        />
        <CardContent>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg text-gray-800"
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
          icon={<span className="text-2xl">🏠</span>}
        />
        <CardContent className="space-y-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name"
            maxLength={50}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-800"
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
          icon={<span className="text-2xl">🚪</span>}
        />
        <CardContent>
          {availableRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🏜️</span>
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
