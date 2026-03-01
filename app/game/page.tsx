'use client';

import { useGameSocket, useSocketErrorBoundary } from '@/hooks';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import GameClient from '@/components/GameClient';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import ConnectionError from '@/components/ConnectionError';
import { LoadingSpinner, Card, CardContent } from '@/components/ui';
import { useRouter } from 'next/navigation';
import GameHeader from '@/components/GameHeader';
import WinCelebration from '@/components/WinCelebration';
import LoseCelebration from '@/components/LoseCelebration';

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
    currentRoomName,
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
  const winnerName = gameState?.winner
    ? gameState.players[gameState.winner]?.name
    : null;

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
      <div className="min-h-screen flex items-center justify-center">
        <Card variant="elevated" className="p-8">
          <CardContent className="flex flex-col items-center gap-4">
            <LoadingSpinner
              size="lg"
              label={
                isReconnecting ? 'Reconnecting...' : 'Connecting to server...'
              }
            />
            {isReconnecting && (
              <p className="text-amber-400 text-sm">
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
      <div className="min-h-screen">
        <GameHeader
          title="🎲 Snakes and Ladders 🐍"
          actions={
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
                aria-hidden="true"
              />
              <span className="text-sm text-slate-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          }
        />
        <div className="py-8 px-4">
          <Lobby
            rooms={availableRooms}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            error={error}
          />
        </div>
      </div>
    );
  }

  // In room, waiting for game to start (guard against gameState not yet arrived)
  if (!gameState?.gameStarted) {
    if (!gameState) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card variant="elevated" className="p-8">
            <CardContent className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" label="Joining room..." />
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="min-h-screen">
        <GameHeader
          title="Waiting Room"
          subtitle={`Room: ${currentRoomName}`}
        />
        <div className="py-8 px-4">
          <WaitingRoom
            gameState={gameState}
            isHost={isHost}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
            myId={myId}
          />
        </div>
      </div>
    );
  }

  // Game in progress - wrap in GameErrorBoundary
  return (
    <div className="h-dvh overflow-hidden">
      <GameHeader
        title="🎲 Snakes and Ladders 🐍"
        subtitle={isMyTurn ? 'Your turn!' : 'Waiting for opponent...'}
        actions={
          <button
            onClick={handleLeaveGame}
            className="text-sm text-rose-400 hover:text-rose-300 font-medium transition-colors"
          >
            Leave Game
          </button>
        }
      />
      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-white text-center py-2 px-4 z-50 pt-safe">
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
          onLeaveGame={handleLeaveGame}
          isHost={isHost}
        />
      </GameErrorBoundary>

      {/* Win Celebration Modal */}
      <WinCelebration
        winnerName={winnerName || ''}
        isVisible={!!gameState?.winner && gameState.winner === myId}
        onPlayAgain={isHost ? resetGame : undefined}
        onLeave={leaveRoom}
        isHost={isHost}
      />

      {/* Lose Celebration Modal */}
      <LoseCelebration
        winnerName={winnerName || ''}
        isVisible={!!gameState?.winner && gameState.winner !== myId}
        onPlayAgain={isHost ? resetGame : undefined}
        onLeave={leaveRoom}
        isHost={isHost}
      />
    </div>
  );
}
