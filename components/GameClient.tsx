'use client';

import CanvasGameBoard from '@/components/CanvasBoardGame';
import DiceRoller from '@/components/DiceRoller';
import { GameState, Player } from '@/lib/types';
import { usePlayerAnimation } from '@/hooks/usePlayerAnimation';
import { useEffect, useRef, useMemo, useState } from 'react';

export default function GameClient({
  gameState,
  rollDice,
  resetGame,
  isMyTurn,
  lastRoll,
  error,
  myId,
}: {
  gameState: GameState | null;
  rollDice: () => void;
  resetGame: () => void;
  isMyTurn: boolean;
  lastRoll: number | null;
  error: string | null;
  myId: string;
}) {
  const { animationState, animatePlayerMove } = usePlayerAnimation();

  // Store visual positions separately from game state
  // This is the KEY fix - we control when visual positions update
  const [visualPositions, setVisualPositions] = useState<
    Record<string, number>
  >({});
  const previousGamePositions = useRef<Record<string, number>>({});
  const pendingAnimations = useRef<Set<string>>(new Set());

  // Initialize visual positions for new players
  useEffect(() => {
    if (!gameState) return;

    Object.values(gameState.players).forEach((player) => {
      // Only initialize if we haven't seen this player before
      if (visualPositions[player.id] === undefined) {
        setVisualPositions((prev) => ({
          ...prev,
          [player.id]: player.position,
        }));
        previousGamePositions.current[player.id] = player.position;
      }
    });
  }, [gameState, visualPositions]);

  // Detect position changes and trigger animations
  useEffect(() => {
    if (!gameState) return;

    Object.values(gameState.players).forEach((player) => {
      const previousPosition = previousGamePositions.current[player.id];

      // If position changed and we're not already animating this player
      if (
        previousPosition !== undefined &&
        previousPosition !== player.position &&
        !pendingAnimations.current.has(player.id)
      ) {
        // Mark as pending animation
        pendingAnimations.current.add(player.id);

        // Trigger animation from previous to new position
        animatePlayerMove(player.id, previousPosition, player.position, {
          onComplete: () => {
            // Animation done - NOW update visual position
            setVisualPositions((prev) => ({
              ...prev,
              [player.id]: player.position,
            }));
            pendingAnimations.current.delete(player.id);
          },
        });

        // Update tracking of game position (not visual position)
        previousGamePositions.current[player.id] = player.position;
      }
    });
  }, [gameState?.players, animatePlayerMove]);

  // Create players array with VISUAL positions (not game state positions)
  const playersWithVisualPositions = useMemo(() => {
    if (!gameState) return [];

    return Object.values(gameState.players).map((player): Player => {
      // Always use visual position, which only updates after animation completes
      const position = visualPositions[player.id] ?? player.position;
      return {
        ...player,
        position,
      };
    });
  }, [gameState, visualPositions]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <p className="text-gray-500 text-xl">Connecting...</p>
      </div>
    );
  }

  const players = Object.values(gameState.players);

  return (
    <div className="relative">
      <CanvasGameBoard
        players={playersWithVisualPositions}
        animatingPlayer={animationState?.playerId}
        animationState={animationState}
      />

      <div className="mt-6 space-y-4">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-center font-semibold">
            ⚠️ {error}
          </div>
        )}

        {lastRoll && (
          <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-3 rounded-lg text-center">
            <span className="text-2xl font-bold">
              🎲 You rolled: {lastRoll}
            </span>
          </div>
        )}

        {!gameState.winner && (
          <div className="bg-gray-50 border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center font-semibold">
            {isMyTurn ? (
              <span className="text-blue-600">
                🎯 Your turn!{' '}
                {animationState?.isAnimating ? 'Moving...' : 'Roll the dice'}
              </span>
            ) : (
              <span>
                ⏳ Waiting for{' '}
                <span className="font-bold text-blue-600">
                  {gameState.players[gameState.currentTurn!]?.name}
                </span>
              </span>
            )}
          </div>
        )}

        {gameState.winner && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-8 py-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              🎉 {gameState.players[gameState.winner]?.name} Wins! 🎉
            </h2>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
            >
              🎮 Play Again
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <DiceRoller
            onRoll={rollDice}
            disabled={
              !isMyTurn || !!gameState.winner || !!animationState?.isAnimating
            }
          />
        </div>
      </div>
    </div>
  );
}
