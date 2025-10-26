'use client';

import GameBoard from '@/components/GameBoard';
import GameClient from '@/components/GameClient';
import GameHeader from '@/components/GameHeader';
import Lobby from '@/components/Lobby';
import WaitingRoom from '@/components/WaitingRoom';
import { useGameSocket } from '@/hooks/useGameSocket';

export default function GamePage() {
  const {
    gameState,
    rollDice,
    resetGame,
    lastRoll,
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

  // Find current room info
  const currentRoom = availableRooms.find((r) => r.id === currentRoomId);

  // Show lobby if not in a room
  if (!currentRoomId) {
    return (
      <div className="min-h-screen flex flex-col">
        <GameHeader
          title="Game Lobby"
          subtitle="Create or join a room to start playing"
          actions={
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {availableRooms.reduce((sum, r) => sum + r.playerCount, 0)}{' '}
                Online
              </span>
            </div>
          }
        />
        <Lobby
          availableRooms={availableRooms}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      </div>
    );
  }

  // Show waiting room if in room but game hasn't started
  if (gameState && !gameState.gameStarted) {
    return (
      <div className="min-h-screen flex flex-col">
        <GameHeader
          title={currentRoom?.name || 'Waiting Room'}
          subtitle={`${Object.keys(gameState.players).length}/4 players • ${
            isHost ? 'You are the host' : 'Waiting for host'
          }`}
          actions={
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-all text-sm"
            >
              Leave Room
            </button>
          }
        />
        <WaitingRoom
          gameState={gameState}
          isHost={isHost}
          roomName={currentRoom?.name}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
        />
      </div>
    );
  }

  // Show game
  const currentPlayer = gameState?.players[myId || ''];
  const isMyTurn = gameState?.currentTurn === myId;

  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader
        title={currentRoom?.name || 'Game In Progress'}
        subtitle={
          gameState?.winner
            ? `🎉 ${gameState.players[gameState.winner]?.name} wins!`
            : isMyTurn
            ? '🎲 Your turn!'
            : `${gameState?.players[gameState?.currentTurn || '']?.name}'s turn`
        }
        actions={
          <div className="flex items-center gap-3">
            {currentPlayer && (
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: [
                      '#EF4444',
                      '#3B82F6',
                      '#10B981',
                      '#F59E0B',
                    ][gameState?.playerOrder.indexOf(myId || '') % 4],
                  }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {currentPlayer.name}
                </span>
              </div>
            )}
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold transition-all text-sm"
            >
              Leave
            </button>
          </div>
        }
      />
      <main className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <div className="relative">
          <GameBoard />
          <GameClient
            gameState={gameState}
            rollDice={rollDice}
            resetGame={resetGame}
            isMyTurn={isMyTurn}
            lastRoll={lastRoll}
            error={error}
            myId={myId}
          />
        </div>
      </main>
    </div>
  );
}
