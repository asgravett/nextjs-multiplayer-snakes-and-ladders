// components/CanvasGameBoard.tsx
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Player } from '@/lib/types';
import { AnimationState } from '@/hooks/usePlayerAnimation';
import { GAME_CONFIG } from '@/lib/constants';

interface CanvasGameBoardProps {
  players: Player[];
  animatingPlayer?: string;
  animationState: AnimationState | null;
  onAnimationComplete?: () => void;
}

const BOARD_SIZE = 600;
const SQUARE_SIZE = BOARD_SIZE / 10;
const PLAYER_RADIUS = 15;
const PLAYER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
];

export default function CanvasGameBoard({
  players,
  animatingPlayer,
  animationState,
  onAnimationComplete,
}: CanvasGameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const boardImageRef = useRef<HTMLImageElement | null>(null);
  const imageLoadedRef = useRef(false);

  // Get the center position of a square on the board
  const getSquarePosition = useCallback(
    (square: number): { x: number; y: number } => {
      if (square < 1) square = 1;
      if (square > 100) square = 100;

      const index = square - 1;
      const row = Math.floor(index / 10);
      const colBase = index % 10;

      // Alternate row direction (snaking pattern)
      const col = row % 2 === 0 ? colBase : 9 - colBase;

      // Y is inverted (row 0 is at bottom)
      const x = col * SQUARE_SIZE + SQUARE_SIZE / 2;
      const y = BOARD_SIZE - (row * SQUARE_SIZE + SQUARE_SIZE / 2);

      return { x, y };
    },
    []
  );

  // Get interpolated position during animation
  const getAnimatedPosition = useCallback(
    (playerId: string, basePosition: number): { x: number; y: number } => {
      if (
        !animationState ||
        animationState.playerId !== playerId ||
        !animationState.isAnimating
      ) {
        return getSquarePosition(basePosition);
      }

      const { fromSquare, toSquare, progress, phase } = animationState;
      const fromPos = getSquarePosition(fromSquare);
      const toPos = getSquarePosition(toSquare);

      // Easing function for smoother animation
      let easedProgress = progress;
      if (phase === 'snake' || phase === 'ladder') {
        // Use ease-in-out for snake/ladder transitions
        easedProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      }

      return {
        x: fromPos.x + (toPos.x - fromPos.x) * easedProgress,
        y: fromPos.y + (toPos.y - fromPos.y) * easedProgress,
      };
    },
    [animationState, getSquarePosition]
  );

  // Get the position to render for a player (handles animation override)
  const getPlayerRenderPosition = useCallback(
    (player: Player): { x: number; y: number } => {
      // If this player is animating, use the animated position
      // The key fix: during animation, we ignore the player's actual position
      // and instead interpolate based on animationState
      if (
        animationState &&
        animationState.playerId === player.id &&
        animationState.isAnimating
      ) {
        return getAnimatedPosition(player.id, player.position);
      }

      // Not animating, use actual position
      return getSquarePosition(player.position);
    },
    [animationState, getAnimatedPosition, getSquarePosition]
  );

  // Draw the board
  const drawBoard = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // Draw board background image if loaded
      if (imageLoadedRef.current && boardImageRef.current) {
        ctx.drawImage(boardImageRef.current, 0, 0, BOARD_SIZE, BOARD_SIZE);
      } else {
        // Fallback: draw a simple grid
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

        for (let i = 0; i < 100; i++) {
          const row = Math.floor(i / 10);
          const colBase = i % 10;
          const col = row % 2 === 0 ? colBase : 9 - colBase;
          const x = col * SQUARE_SIZE;
          const y = BOARD_SIZE - (row + 1) * SQUARE_SIZE;

          ctx.fillStyle = (row + colBase) % 2 === 0 ? '#ffffff' : '#e0e0e0';
          ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

          // Draw square number
          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            String(i + 1),
            x + SQUARE_SIZE / 2,
            y + SQUARE_SIZE / 2 + 4
          );
        }
      }

      // Draw players
      players.forEach((player, index) => {
        const pos = getPlayerRenderPosition(player);

        // Offset multiple players on same square
        const playersOnSquare = players.filter((p) => {
          const pPos = getPlayerRenderPosition(p);
          return Math.abs(pPos.x - pos.x) < 5 && Math.abs(pPos.y - pos.y) < 5;
        });
        const playerIndex = playersOnSquare.indexOf(player);
        const offsetX = (playerIndex % 2) * 20 - 10;
        const offsetY = Math.floor(playerIndex / 2) * 20 - 10;

        // Draw player piece
        ctx.beginPath();
        ctx.arc(
          pos.x + offsetX,
          pos.y + offsetY,
          PLAYER_RADIUS,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = PLAYER_COLORS[index % PLAYER_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw player initial
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          player.name.charAt(0).toUpperCase(),
          pos.x + offsetX,
          pos.y + offsetY
        );
      });
    },
    [players, getPlayerRenderPosition]
  );

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      drawBoard(ctx);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawBoard]);

  // Load board image
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/board.png'; // Make sure this image exists in /public
    img.onload = () => {
      boardImageRef.current = img;
      imageLoadedRef.current = true;
    };
    img.onerror = () => {
      console.warn('Board image not found, using fallback grid');
      imageLoadedRef.current = false;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={BOARD_SIZE}
      height={BOARD_SIZE}
      className="border-4 border-gray-800 rounded-lg shadow-xl mx-auto"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
