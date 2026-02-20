'use client';

import CanvasGameBoard from '@/components/CanvasBoardGame';
import DiceRoller from '@/components/DiceRoller';
import { GameState, Player } from '@/lib/types';
import { usePlayerAnimation } from '@/hooks/usePlayerAnimation';
import { useEffect, useRef, useMemo, useState } from 'react';
import { GAME_CONFIG } from '@/lib/constants';
import { ErrorMessage } from '@/components/ui';
import type { LastRollInfo } from '@/hooks/useGameSocket';

export default function GameClient({
  gameState,
  rollDice,
  resetGame,
  isMyTurn,
  lastRollInfo,
  error,
  myId,
  onLeaveGame,
  isHost,
}: {
  gameState: GameState | null;
  rollDice: () => void;
  resetGame: () => void;
  isMyTurn: boolean;
  lastRollInfo: LastRollInfo | null;
  error: string | null;
  myId: string | null;
  onLeaveGame?: () => void;
  isHost?: boolean;
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
    <div className="flex justify-center items-center p-2 landscape:p-4 h-[calc(100dvh-64px)] overflow-hidden">
      <div className="flex flex-col landscape:flex-row landscape:items-center gap-2 landscape:gap-6">
        {/* Board — sizes to fit the canvas, centered with sidebar */}
        <div className="shrink-0 flex justify-center">
          <CanvasGameBoard
            players={playersWithVisualPositions}
            animatingPlayer={animationState?.playerId}
            animationState={animationState}
          />
        </div>

        {/* Controls sidebar — stacks below on mobile, sits right in landscape */}
        <div className="w-full landscape:w-72 xl:w-80 flex flex-col gap-2 landscape:gap-4 shrink-0">
          {/* Error Message — reserved space */}
          <div className="min-h-0">
            {error && <ErrorMessage message={error} variant="error" />}
          </div>

          {/* Roll Message — always reserves its height to prevent reflow */}
          <div className="min-h-10 landscape:min-h-12">
            {rollMessage ? (
              <ErrorMessage message={rollMessage} variant="info" icon="🎲" />
            ) : (
              <div aria-hidden className="h-10 landscape:h-12" />
            )}
          </div>

          {/* Turn Indicator — always reserves its height to prevent reflow */}
          <div className="min-h-[52px]">
            {!gameState.winner ? (
              <div className="bg-gray-50 border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center font-semibold">
                {isMyTurn ? (
                  <span className="text-blue-600">
                    🎯 Your turn!{' '}
                    {animationState?.isAnimating
                      ? 'Moving...'
                      : 'Roll the dice'}
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
            ) : (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg text-center font-semibold">
                🎉 {gameState.players[gameState.winner]?.name} Wins!
              </div>
            )}
          </div>

          {/* Dice Roller */}
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
