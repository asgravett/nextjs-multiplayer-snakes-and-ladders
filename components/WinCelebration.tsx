'use client';

import { Button } from '@/components/ui';

interface WinCelebrationProps {
  winnerName: string;
  isVisible: boolean;
  onPlayAgain?: () => void;
  onLeave?: () => void;
  isHost?: boolean;
}

export default function WinCelebration({
  winnerName,
  isVisible,
  onPlayAgain,
  onLeave,
  isHost = false,
}: WinCelebrationProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Trophy */}
        <div className="text-8xl mb-4">🏆</div>

        {/* Victory message */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🎉 Victory! 🎉
        </h2>
        <p className="text-xl text-gray-600 mb-6">
          <span className="font-bold text-blue-600">{winnerName}</span> wins the
          game!
        </p>

        {/* Stars decoration */}
        <div className="flex justify-center gap-2 mb-6 text-2xl">
          <span>⭐</span>
          <span>✨</span>
          <span>🌟</span>
          <span>✨</span>
          <span>⭐</span>
        </div>

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
