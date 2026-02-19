'use client';

import { useState, useCallback, useRef } from 'react';
import { SNAKES_AND_LADDERS } from '@/lib/constants';

export interface AnimationState {
  playerId: string;
  fromSquare: number;
  toSquare: number;
  progress: number;
  isAnimating: boolean;
  phase: 'moving' | 'snake' | 'ladder' | 'idle';
}

interface AnimationOptions {
  msPerSquare?: number;
  snakeLadderDuration?: number;
  onComplete?: () => void;
}

const DEFAULT_MS_PER_SQUARE = 200;
const DEFAULT_SNAKE_LADDER_DURATION = 600;

// Enable debug logging
const DEBUG_ANIMATION = true;

const debugLog = (...args: unknown[]) => {
  if (DEBUG_ANIMATION) {
    console.log('[Animation]', ...args);
  }
};

// Build a reverse lookup: destination -> start (at module level, not inside function)
const SNAKE_LADDER_REVERSE: Record<number, number> = {};
for (const [start, end] of Object.entries(SNAKES_AND_LADDERS)) {
  SNAKE_LADDER_REVERSE[Number(end)] = Number(start);
}

debugLog('SNAKES_AND_LADDERS:', SNAKES_AND_LADDERS);
debugLog('SNAKE_LADDER_REVERSE:', SNAKE_LADDER_REVERSE);

export function usePlayerAnimation() {
  const [animationState, setAnimationState] = useState<AnimationState | null>(
    null,
  );
  const animationRef = useRef<number>();
  const isAnimatingRef = useRef(false);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    isAnimatingRef.current = false;
    setAnimationState(null);
  }, []);

  const animateSegment = useCallback(
    (
      playerId: string,
      fromSquare: number,
      toSquare: number,
      duration: number,
      phase: 'moving' | 'snake' | 'ladder',
    ): Promise<void> => {
      debugLog(`animateSegment: ${fromSquare} -> ${toSquare}, phase: ${phase}`);
      return new Promise((resolve) => {
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          if (!isAnimatingRef.current) {
            resolve();
            return;
          }

          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          setAnimationState({
            playerId,
            fromSquare,
            toSquare,
            progress,
            isAnimating: true,
            phase,
          });

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      });
    },
    [],
  );

  const animateSquareBySquare = useCallback(
    async (
      playerId: string,
      fromSquare: number,
      toSquare: number,
      msPerSquare: number,
    ): Promise<void> => {
      debugLog(`animateSquareBySquare: ${fromSquare} -> ${toSquare}`);
      const direction = toSquare > fromSquare ? 1 : -1;
      let currentSquare = fromSquare;

      while (currentSquare !== toSquare && isAnimatingRef.current) {
        const nextSquare = currentSquare + direction;
        await animateSegment(
          playerId,
          currentSquare,
          nextSquare,
          msPerSquare,
          'moving',
        );
        currentSquare = nextSquare;
      }
    },
    [animateSegment],
  );

  const animatePlayerMove = useCallback(
    async (
      playerId: string,
      fromSquare: number,
      toSquare: number,
      options: AnimationOptions = {},
    ) => {
      const {
        msPerSquare = DEFAULT_MS_PER_SQUARE,
        snakeLadderDuration = DEFAULT_SNAKE_LADDER_DURATION,
        onComplete,
      } = options;

      debugLog('=== animatePlayerMove START ===');
      debugLog(`Player: ${playerId}`);
      debugLog(`From: ${fromSquare} -> To: ${toSquare}`);

      // Cancel any existing animation
      cancelAnimation();
      isAnimatingRef.current = true;

      try {
        // Check if final position (toSquare) is the result of a snake/ladder
        // SNAKE_LADDER_REVERSE maps: end position -> start position
        const snakeLadderStart = SNAKE_LADDER_REVERSE[toSquare];

        debugLog(
          `snakeLadderStart (from reverse lookup of ${toSquare}): ${snakeLadderStart}`,
        );

        // Check if a snake/ladder was triggered:
        // The toSquare is a known snake/ladder destination AND
        // the snakeLadderStart is between fromSquare+1 and fromSquare+6 (dice roll landed on it)
        const diceRollLandedOnSnakeLadder =
          snakeLadderStart !== undefined &&
          snakeLadderStart > fromSquare &&
          snakeLadderStart <= fromSquare + 6;

        debugLog(`Dice roll range: ${fromSquare + 1} to ${fromSquare + 6}`);
        debugLog(
          `Is snake/ladder start in range: ${diceRollLandedOnSnakeLadder}`,
        );

        if (diceRollLandedOnSnakeLadder) {
          debugLog(
            `Snake/Ladder detected! Moving to ${snakeLadderStart} first, then to ${toSquare}`,
          );

          // Phase 1: Animate square-by-square to the snake/ladder start
          await animateSquareBySquare(
            playerId,
            fromSquare,
            snakeLadderStart,
            msPerSquare,
          );

          // Small pause before snake/ladder animation
          if (isAnimatingRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 150));
          }

          // Phase 2: Animate diagonally along the snake/ladder
          if (isAnimatingRef.current) {
            const isSnake = toSquare < snakeLadderStart;
            debugLog(
              `Animating ${isSnake ? 'snake' : 'ladder'}: ${snakeLadderStart} -> ${toSquare}`,
            );
            await animateSegment(
              playerId,
              snakeLadderStart,
              toSquare,
              snakeLadderDuration,
              isSnake ? 'snake' : 'ladder',
            );
          }
        } else {
          debugLog(
            `No snake/ladder - regular move: ${fromSquare} -> ${toSquare}`,
          );
          // No snake/ladder - just animate square-by-square
          await animateSquareBySquare(
            playerId,
            fromSquare,
            toSquare,
            msPerSquare,
          );
        }

        // Animation complete
        if (isAnimatingRef.current) {
          setAnimationState({
            playerId,
            fromSquare: toSquare,
            toSquare: toSquare,
            progress: 1,
            isAnimating: false,
            phase: 'idle',
          });
        }

        debugLog('=== animatePlayerMove COMPLETE ===');
        onComplete?.();
      } catch (error) {
        console.error('Animation error:', error);
      } finally {
        isAnimatingRef.current = false;
        setTimeout(() => {
          setAnimationState(null);
        }, 100);
      }
    },
    [cancelAnimation, animateSquareBySquare, animateSegment],
  );

  return {
    animationState,
    animatePlayerMove,
    cancelAnimation,
    isAnimating: isAnimatingRef.current,
  };
}
