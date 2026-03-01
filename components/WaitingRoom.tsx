'use client';

import { GameState } from '@/lib/types';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui';
import PlayerCard from '@/components/PlayerCard';

interface WaitingRoomProps {
  gameState: GameState;
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  myId: string | null;
  roomName?: string;
}

export default function WaitingRoom({
  gameState,
  isHost,
  onStartGame,
  onLeaveRoom,
  myId,
  roomName = 'Game Room',
}: WaitingRoomProps) {
  const players = Object.values(gameState.players);
  const canStart = players.length >= 2;

  return (
    <Card variant="elevated" className="max-w-md mx-auto">
      <CardHeader
        title={roomName}
        subtitle={`Waiting for players... (${players.length}/4)`}
        icon={<span className="text-lg">⏳</span>}
      />

      <CardContent>
        {/* Players List */}
        <div className="space-y-3 mb-6">
          {players.length === 0 ? (
            <div className="text-center py-4 text-slate-500">
              No players yet...
            </div>
          ) : (
            players.map((player, index) => (
              <PlayerCard
                key={player.id}
                name={player.name}
                isHost={gameState.playerOrder[0] === player.id}
                isMe={player.id === myId}
                colorIndex={index}
              />
            ))
          )}
        </div>

        {/* Empty slots (decorative) */}
        {Array.from({ length: 4 - players.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-dashed border-white/10 mb-3"
            aria-hidden="true"
          >
            <div className="w-10 h-10 bg-white/6 rounded-full flex items-center justify-center">
              <span className="text-slate-600">?</span>
            </div>
            <span className="text-slate-600">Waiting for player...</span>
          </div>
        ))}

        {/* Start Game Requirements */}
        {!canStart && (
          <div className="text-center text-amber-400 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
            ⚠️ Need at least 2 players to start
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button onClick={onLeaveRoom} variant="ghost" className="flex-1">
          Leave
        </Button>
        {isHost && (
          <Button
            onClick={onStartGame}
            disabled={!canStart}
            className="flex-1"
            size="lg"
            leftIcon={<span>🎲</span>}
          >
            Start Game
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
