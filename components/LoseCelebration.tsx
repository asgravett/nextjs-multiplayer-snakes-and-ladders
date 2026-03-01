'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui';

interface LoseCelebrationProps {
  winnerName: string;
  isVisible: boolean;
  onPlayAgain?: () => void;
  onLeave?: () => void;
  isHost?: boolean;
}

export default function LoseCelebration({
  winnerName,
  isVisible,
  onPlayAgain,
  onLeave,
  isHost = false,
}: LoseCelebrationProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside the dialog while visible
  useEffect(() => {
    if (!isVisible || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lose-dialog-title"
        className="bg-white/6 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/40 p-8 max-w-md w-full text-center"
      >
        {/* Defeat icon */}
        <div className="text-8xl mb-4" aria-hidden="true">
          😢
        </div>

        {/* Defeat message */}
        <h2
          id="lose-dialog-title"
          className="text-3xl font-bold text-slate-100 mb-2"
        >
          💔 You Lose! 💔
        </h2>
        <p className="text-xl text-slate-400 mb-6">
          {winnerName && (
            <>
              <span className="font-bold text-cyan-400">{winnerName}</span> won
              the game!
            </>
          )}
        </p>

        {/* Decoration */}
        <div
          className="flex justify-center gap-2 mb-6 text-2xl"
          aria-hidden="true"
        >
          <span>😞</span>
          <span>💪</span>
          <span>🎲</span>
          <span>💪</span>
          <span>😞</span>
        </div>

        <p className="text-sm text-slate-500 mb-6">Better luck next time!</p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isHost && onPlayAgain && (
            <Button
              onClick={onPlayAgain}
              variant="primary"
              size="lg"
              leftIcon={<span>🔄</span>}
            >
              Play Again
            </Button>
          )}
          {onLeave && (
            <Button
              onClick={onLeave}
              variant="secondary"
              size="lg"
              leftIcon={<span>🚪</span>}
            >
              Leave Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
