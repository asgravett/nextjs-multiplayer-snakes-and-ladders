'use client';

import { useGameSocket, useSocketErrorBoundary } from '@/hooks';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import GameClient from '@/components/GameClient';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import ConnectionError from '@/components/ConnectionError';
import { LoadingSpinner, Card, CardContent } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function GamePage() {
  const router = useRouter();

  // Initialize socket error boundary first
  const {
    error: socketError,
    clearError: clearSocketError,
    incrementRetry,
    errorHandler,
  } = useSocketErrorBoundary();

  // Pass error handler to socket hook
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
    isConnected,
    isReconnecting,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    reconnect,
  } = useGameSocket(errorHandler);

  const isMyTurn = gameState?.currentTurn === myId;

  const handleRetry = () => {
    incrementRetry();
    clearSocketError();
    reconnect();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleLeaveGame = () => {
    leaveRoom();
  };

  // Show connection error
  if (socketError) {
    return (
      <ConnectionError
        error={socketError}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
    );
  }

  // Not connected yet or reconnecting
  if (!myId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card variant="elevated" className="p-8">
          <CardContent className="flex flex-col items-center gap-4">
            <LoadingSpinner
              size="lg"
              label={
                isReconnecting ? 'Reconnecting...' : 'Connecting to server...'
              }
            />
            {isReconnecting && (
              <p className="text-amber-600 text-sm">
                Connection lost. Attempting to reconnect...
              </p>
            )}
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
          {/* Connection status indicator */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
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

  // Game in progress - wrap in GameErrorBoundary
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4">
      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 px-4 z-50">
          <span className="animate-pulse">
            ⚠️ Connection lost. Reconnecting...
          </span>
        </div>
      )}

      <GameErrorBoundary onLeaveGame={handleLeaveGame} roomId={currentRoomId}>
        <GameClient
          gameState={gameState}
          rollDice={rollDice}
          resetGame={resetGame}
          isMyTurn={isMyTurn}
          lastRollInfo={lastRollInfo}
          error={error}
          myId={myId}
        />
      </GameErrorBoundary>
    </div>
  );
}
