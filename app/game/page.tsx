'use client';

import { useGameSocket } from '@/hooks';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import GameClient from '@/components/GameClient';
import { LoadingSpinner, Card, CardContent } from '@/components/ui';

export default function GamePage() {
  const {
    gameState,
    rollDice,
    resetGame,
    lastRollInfo,
    error,
    myId,
    currentRoomId,
    availableRooms,
    isHost,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
  } = useGameSocket();

  const isMyTurn = gameState?.currentTurn === myId;

  // Not connected yet
  if (!myId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card variant="elevated" className="p-8">
          <CardContent className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" label="Connecting to server..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  // In lobby (not in a room)
  if (!currentRoomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🐍 Snakes & Ladders 🪜
          </h1>
          <p className="text-gray-600">Multiplayer Board Game</p>
        </div>
        <Lobby
          rooms={availableRooms}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
        />
      </div>
    );
  }

  // In room, waiting for game to start
  if (!gameState?.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <WaitingRoom
          gameState={gameState!}
          isHost={isHost}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
          myId={myId}
        />
      </div>
    );
  }

  // Game in progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4">
      <GameClient
        gameState={gameState}
        rollDice={rollDice}
        resetGame={resetGame}
        isMyTurn={isMyTurn}
        lastRollInfo={lastRollInfo}
        error={error}
        myId={myId}
      />
    </div>
  );
}
