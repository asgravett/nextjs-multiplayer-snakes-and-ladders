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

// Find which snake/ladder start position in the dice roll range leads to the given destination.
// This avoids a reverse lookup map that breaks when multiple entries share the same destination
// (e.g. both 30→96 and 57→96).
function findSnakeLadderStart(
  fromSquare: number,
  toSquare: number,
): number | undefined {
  for (let pos = fromSquare + 1; pos <= fromSquare + 6; pos++) {
    if (SNAKES_AND_LADDERS[pos] === toSquare) {
      return pos;
    }
  }
  return undefined;
}

export function usePlayerAnimation() {
  const [animationState, setAnimationState] = useState<AnimationState | null>(
    null,
  );
  const animationRef = useRef<number>(undefined);
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

      // Cancel any existing animation
      cancelAnimation();
      isAnimatingRef.current = true;

      try {
        // Check if final position (toSquare) is the result of a snake/ladder
        // by finding a snake/ladder start in the dice roll range that leads to toSquare
        const snakeLadderStart = findSnakeLadderStart(fromSquare, toSquare);

        // Check if a snake/ladder was triggered
        const diceRollLandedOnSnakeLadder = snakeLadderStart !== undefined;

        if (diceRollLandedOnSnakeLadder) {
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

            await animateSegment(
              playerId,
              snakeLadderStart,
              toSquare,
              snakeLadderDuration,
              isSnake ? 'snake' : 'ladder',
            );
          }
        } else {
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
