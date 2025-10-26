'use client';

import PlayerPiece from '@/components/PlayerPiece';
import DiceRoller from '@/components/DiceRoller';

interface Player {
  id: string;
  name: string;
  position: number;
}

interface GameState {
  players: { [key: string]: Player };
  currentTurn: string | null;
  winner: string | null;
}

interface GameClientProps {
  gameState: GameState | null;
  rollDice: () => void;
  resetGame: () => void;
  isMyTurn: boolean;
  lastRoll: number | null;
  error: string | null;
  myId: string;
}

// Offset positions for multiple players on same square
const getPlayerOffset = (playerIndex: number, totalOnSquare: number) => {
  if (totalOnSquare === 1) {
    return { x: 0, y: 0 };
  }

  // Positions for 2-4 players in corners of a square
  const offsets = [
    { x: -8, y: -8 }, // Top-left
    { x: 8, y: -8 }, // Top-right
    { x: -8, y: 8 }, // Bottom-left
    { x: 8, y: 8 }, // Bottom-right
  ];

  return offsets[playerIndex] || { x: 0, y: 0 };
};

export default function GameClient({
  gameState,
  rollDice,
  resetGame,
  isMyTurn,
  lastRoll,
  error,
  myId,
}: GameClientProps) {
  if (!gameState) {
    return (
      <div className="absolute top-0 left-0 w-[600px] h-[600px] flex items-center justify-center">
        <p className="text-white text-xl">Connecting...</p>
      </div>
    );
  }

  const players = Object.values(gameState.players);

  // Group players by position
  const playersByPosition = players.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {} as Record<number, Player[]>);

  return (
    <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none">
      {/* Player pieces */}
      {players.map((p) => {
        const playersOnSquare = playersByPosition[p.position];
        const playerIndexOnSquare = playersOnSquare.findIndex(
          (pl) => pl.id === p.id
        );
        const offset = getPlayerOffset(
          playerIndexOnSquare,
          playersOnSquare.length
        );
        const colorIndex = players.findIndex((pl) => pl.id === p.id);

        return (
          <PlayerPiece
            key={p.id}
            position={p.position}
            color={['red', 'blue', 'green', 'yellow'][colorIndex % 4]}
            offset={offset}
          />
        );
      })}

      {/* Game UI */}
      <div className="pointer-events-auto">
        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
            {error}
          </div>
        )}

        {/* Last roll display */}
        {lastRoll && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg text-2xl font-bold z-50">
            🎲 {lastRoll}
          </div>
        )}

        {/* Turn indicator */}
        {!gameState.winner && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg z-50">
            {isMyTurn
              ? 'Your turn!'
              : `${gameState.players[gameState.currentTurn!]?.name}'s turn`}
          </div>
        )}

        {/* Winner message */}
        {gameState.winner && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-6 rounded-lg shadow-xl text-center z-50">
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
