'use client';

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
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Defeat icon */}
        <div className="text-8xl mb-4">😢</div>

        {/* Defeat message */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          💔 You Lose! 💔
        </h2>
        <p className="text-xl text-gray-600 mb-6">
          <span className="font-bold text-blue-600">{winnerName}</span> won the
          game!
        </p>

        {/* Decoration */}
        <div className="flex justify-center gap-2 mb-6 text-2xl">
          <span>😞</span>
          <span>💪</span>
          <span>🎲</span>
          <span>💪</span>
          <span>😞</span>
        </div>

        <p className="text-sm text-gray-500 mb-6">Better luck next time!</p>

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
