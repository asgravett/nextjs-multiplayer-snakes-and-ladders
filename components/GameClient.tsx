'use client';

import CanvasGameBoard from '@/components/CanvasBoardGame';
import DiceRoller from '@/components/DiceRoller';
import { GameState, Player } from '@/lib/types';
import { usePlayerAnimation } from '@/hooks/usePlayerAnimation';
import { useEffect, useRef, useMemo, useState } from 'react';
import { GAME_CONFIG } from '@/lib/constants';

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
  const { animationState, animatePlayerMove, cancelAnimation } =
    usePlayerAnimation();

  // Store visual positions separately from game state
  const [visualPositions, setVisualPositions] = useState<
    Record<string, number>
  >({});
  const previousGamePositions = useRef<Record<string, number>>({});
  const pendingAnimations = useRef<Set<string>>(new Set());
  const isResetting = useRef(false);

  // Initialize visual positions for new players
  useEffect(() => {
    if (!gameState) return;

    Object.values(gameState.players).forEach((player) => {
      if (visualPositions[player.id] === undefined) {
        setVisualPositions((prev) => ({
          ...prev,
          [player.id]: player.position,
        }));
        previousGamePositions.current[player.id] = player.position;
      }
    });
  }, [gameState, visualPositions]);

  // Detect game reset (all players at starting position)
  useEffect(() => {
    if (!gameState) return;

    const allPlayersAtStart = Object.values(gameState.players).every(
      (player) => player.position === GAME_CONFIG.STARTING_POSITION,
    );

    const anyPlayerNotAtStartVisually = Object.values(gameState.players).some(
      (player) => {
        const visualPos = visualPositions[player.id];
        return (
          visualPos !== undefined && visualPos !== GAME_CONFIG.STARTING_POSITION
        );
      },
    );

    // This is a reset - all game positions are at start but visual positions aren't
    if (
      allPlayersAtStart &&
      anyPlayerNotAtStartVisually &&
      !isResetting.current
    ) {
      isResetting.current = true;

      // Cancel any ongoing animations
      cancelAnimation();
      pendingAnimations.current.clear();

      // Instantly reset all visual positions (or animate all simultaneously)
      const newVisualPositions: Record<string, number> = {};
      Object.values(gameState.players).forEach((player) => {
        newVisualPositions[player.id] = GAME_CONFIG.STARTING_POSITION;
        previousGamePositions.current[player.id] =
          GAME_CONFIG.STARTING_POSITION;
      });

      // Small delay for visual effect, then snap to start
      setTimeout(() => {
        setVisualPositions(newVisualPositions);
        isResetting.current = false;
      }, 100);
    }
  }, [gameState, visualPositions, cancelAnimation]);

  // Detect position changes and trigger animations (for normal gameplay, not reset)
  useEffect(() => {
    if (!gameState || isResetting.current) return;

    Object.values(gameState.players).forEach((player) => {
      const previousPosition = previousGamePositions.current[player.id];

      // Skip if this is a reset to starting position (handled above)
      if (
        player.position === GAME_CONFIG.STARTING_POSITION &&
        previousPosition !== undefined
      ) {
        return;
      }

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
  }, [gameState, animatePlayerMove]);

  // Create players array with VISUAL positions (not game state positions)
  const playersWithVisualPositions = useMemo(() => {
    if (!gameState) return [];

    return Object.values(gameState.players).map((player): Player => {
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
