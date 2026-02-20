// components/CanvasGameBoard.tsx
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Player } from '@/lib/types';
import { AnimationState } from '@/hooks/usePlayerAnimation';
import { useResponsiveCanvas } from '@/hooks/useResponsiveCanvas';

interface CanvasGameBoardProps {
  players: Player[];
  animatingPlayer?: string;
  animationState: AnimationState | null;
  onAnimationComplete?: () => void;
}

// Base sizes (used for scaling calculations)
const BASE_BOARD_SIZE = 600;
const BASE_SQUARE_SIZE = BASE_BOARD_SIZE / 10;
const BASE_PLAYER_RADIUS = 15;

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
  animationState,
}: CanvasGameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(undefined);
  const boardImageRef = useRef<HTMLImageElement | null>(null);
  const imageLoadedRef = useRef(false);

  // Use responsive canvas dimensions
  const { width: canvasSize, scale } = useResponsiveCanvas(containerRef, {
    baseSize: BASE_BOARD_SIZE,
    minSize: 280,
    maxSize: 700,
    padding: 16,
    reserveBottomSpace: 80,
    reserveBottomSpaceMobile: 230,
  });

  // Scaled values
  const squareSize = BASE_SQUARE_SIZE * scale;
  const playerRadius = BASE_PLAYER_RADIUS * scale;

  // Get the center position of a square on the board (scaled)
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
      const x = col * squareSize + squareSize / 2;
      const y = canvasSize - (row * squareSize + squareSize / 2);

      return { x, y };
    },
    [squareSize, canvasSize],
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
        // Ease in-out for snake/ladder transitions
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
    [animationState, getSquarePosition],
  );

  // Get render position for a player
  const getPlayerRenderPosition = useCallback(
    (player: Player): { x: number; y: number } => {
      if (
        animationState &&
        animationState.playerId === player.id &&
        animationState.isAnimating
      ) {
        return getAnimatedPosition(player.id, player.position);
      }
      return getSquarePosition(player.position);
    },
    [animationState, getAnimatedPosition, getSquarePosition],
  );

  // Draw the board
  const drawBoard = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Draw board background image if loaded
      if (imageLoadedRef.current && boardImageRef.current) {
        ctx.drawImage(boardImageRef.current, 0, 0, canvasSize, canvasSize);
      } else {
        // Fallback: draw a simple grid
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        for (let i = 0; i < 100; i++) {
          const row = Math.floor(i / 10);
          const colBase = i % 10;
          const col = row % 2 === 0 ? colBase : 9 - colBase;
          const x = col * squareSize;
          const y = canvasSize - (row + 1) * squareSize;

          ctx.fillStyle = (row + colBase) % 2 === 0 ? '#ffffff' : '#e0e0e0';
          ctx.fillRect(x, y, squareSize, squareSize);

          // Draw square number (scaled font)
          ctx.fillStyle = '#666';
          ctx.font = `${Math.max(10, 12 * scale)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(
            String(i + 1),
            x + squareSize / 2,
            y + squareSize / 2 + 4 * scale,
          );
        }
      }

      // Draw players
      players.forEach((player, index) => {
        const pos = getPlayerRenderPosition(player);

        // Offset multiple players on same square (scaled)
        const playersOnSquare = players.filter((p) => {
          const pPos = getPlayerRenderPosition(p);
          return (
            Math.abs(pPos.x - pos.x) < 5 * scale &&
            Math.abs(pPos.y - pos.y) < 5 * scale
          );
        });
        const playerIndex = playersOnSquare.indexOf(player);
        const offsetX = (playerIndex % 2) * 20 * scale - 10 * scale;
        const offsetY = Math.floor(playerIndex / 2) * 20 * scale - 10 * scale;

        // Draw player piece
        ctx.beginPath();
        ctx.arc(pos.x + offsetX, pos.y + offsetY, playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = PLAYER_COLORS[index % PLAYER_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Draw player initial (scaled font)
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(10, 14 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          player.name.charAt(0).toUpperCase(),
          pos.x + offsetX,
          pos.y + offsetY,
        );
      });
    },
    [
      players,
      getPlayerRenderPosition,
      canvasSize,
      squareSize,
      playerRadius,
      scale,
    ],
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
    img.src = '/assets/board.png';
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
    <div
      ref={containerRef}
      className="flex justify-center"
      style={{ minHeight: canvasSize }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border-4 border-gray-800 rounded-lg shadow-xl"
        style={{
          width: canvasSize,
          height: canvasSize,
          touchAction: 'none',
        }}
      />
    </div>
  );
}
