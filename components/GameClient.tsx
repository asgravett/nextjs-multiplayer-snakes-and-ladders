'use client';

import CanvasGameBoard from '@/components/CanvasBoardGame';
import DiceRoller from '@/components/DiceRoller';
import { GameState, Player } from '@/lib/types';
import { usePlayerAnimation } from '@/hooks/usePlayerAnimation';
import { useEffect, useRef, useMemo, useState } from 'react';
import { GAME_CONFIG } from '@/lib/constants';
import { Button, ErrorMessage } from '@/components/ui';
import type { LastRollInfo } from '@/hooks/useGameSocket';

export default function GameClient({
  gameState,
  rollDice,
  resetGame,
  isMyTurn,
  lastRollInfo,
  error,
  myId,
}: {
  gameState: GameState | null;
  rollDice: () => void;
  resetGame: () => void;
  isMyTurn: boolean;
  lastRollInfo: LastRollInfo | null;
  error: string | null;
  myId: string | null;
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

    if (
      allPlayersAtStart &&
      anyPlayerNotAtStartVisually &&
      !isResetting.current
    ) {
      isResetting.current = true;
      cancelAnimation();
      pendingAnimations.current.clear();

      const newVisualPositions: Record<string, number> = {};
      Object.values(gameState.players).forEach((player) => {
        newVisualPositions[player.id] = GAME_CONFIG.STARTING_POSITION;
        previousGamePositions.current[player.id] =
          GAME_CONFIG.STARTING_POSITION;
      });

      setTimeout(() => {
        setVisualPositions(newVisualPositions);
        isResetting.current = false;
      }, 100);
    }
  }, [gameState, visualPositions, cancelAnimation]);

  // Detect position changes and trigger animations
  useEffect(() => {
    if (!gameState || isResetting.current) return;

    Object.values(gameState.players).forEach((player) => {
      const previousPosition = previousGamePositions.current[player.id];

      if (
        player.position === GAME_CONFIG.STARTING_POSITION &&
        previousPosition !== undefined
      ) {
        return;
      }

      if (
        previousPosition !== undefined &&
        previousPosition !== player.position &&
        !pendingAnimations.current.has(player.id)
      ) {
        pendingAnimations.current.add(player.id);

        animatePlayerMove(player.id, previousPosition, player.position, {
          onComplete: () => {
            setVisualPositions((prev) => ({
              ...prev,
              [player.id]: player.position,
            }));
            pendingAnimations.current.delete(player.id);
          },
        });

        previousGamePositions.current[player.id] = player.position;
      }
    });
  }, [gameState, animatePlayerMove]);

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

  const getRollMessage = () => {
    if (!lastRollInfo || !gameState) return null;

    const rollerName = gameState.players[lastRollInfo.playerId]?.name;
    const isMyRoll = lastRollInfo.playerId === myId;

    if (isMyRoll) {
      return `🎲 You rolled: ${lastRollInfo.roll}`;
    } else {
      return `🎲 ${rollerName} rolled: ${lastRollInfo.roll}`;
    }
  };

  const rollMessage = getRollMessage();

  return (
    <div className="relative">
      <CanvasGameBoard
        players={playersWithVisualPositions}
        animatingPlayer={animationState?.playerId}
        animationState={animationState}
      />

      <div className="mt-6 space-y-4">
        {/* Error Message */}
        {error && <ErrorMessage message={error} variant="error" />}

        {/* Roll Message */}
        {rollMessage && (
          <ErrorMessage message={rollMessage} variant="info" icon="🎲" />
        )}

        {/* Turn Indicator */}
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

        {/* Winner Celebration */}
        {gameState.winner && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-8 py-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              🎉 {gameState.players[gameState.winner]?.name} Wins! 🎉
            </h2>
            <Button onClick={resetGame} size="lg" leftIcon={<span>🎮</span>}>
              Play Again
            </Button>
          </div>
        )}

        {/* Dice Roller */}
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
