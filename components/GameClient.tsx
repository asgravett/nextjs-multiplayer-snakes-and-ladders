'use client';

import PlayerPiece from '@/components/PlayerPiece';
import DiceRoller from '@/components/DiceRoller';
import { useGameSocket } from '@/hooks/useGameSocket';

export default function GameClient() {
  const { gameState, rollDice, resetGame, isMyTurn, lastRoll, error, myId } =
    useGameSocket();

  if (!gameState) {
    return (
      <div className="absolute top-0 left-0 w-[600px] h-[600px] flex items-center justify-center">
        <p className="text-white text-xl">Connecting...</p>
      </div>
    );
  }

  const players = Object.values(gameState.players);

  return (
    <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none">
      {/* Player pieces */}
      {players.map((p, i) => (
        <PlayerPiece
          key={p.id}
          position={p.position}
          color={['red', 'blue', 'green', 'yellow'][i % 4]}
        />
      ))}

      {/* Game UI */}
      <div className="pointer-events-auto">
        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Last roll display */}
        {lastRoll && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg text-2xl font-bold">
            🎲 {lastRoll}
          </div>
        )}

        {/* Turn indicator */}
        {!gameState.winner && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg">
            {isMyTurn
              ? 'Your turn!'
              : `${gameState.players[gameState.currentTurn!]?.name}'s turn`}
          </div>
        )}

        {/* Winner message */}
        {gameState.winner && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-6 rounded-lg shadow-xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              🎉 {gameState.players[gameState.winner]?.name} Wins! 🎉
            </h2>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-white text-green-500 rounded-lg hover:bg-gray-100 font-semibold"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Dice roller */}
        <DiceRoller
          onRoll={rollDice}
          disabled={!isMyTurn || !!gameState.winner}
        />
      </div>
    </div>
  );
}
