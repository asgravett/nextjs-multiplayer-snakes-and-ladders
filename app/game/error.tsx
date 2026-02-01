'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';

interface GameErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GameError({ error, reset }: GameErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Game error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center space-y-6">
          {/* Error Icon */}
          <div className="text-7xl">🎮💔</div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Game Error
            </h1>
            <p className="text-gray-500">
              Something went wrong with the game. Don't worry, you can try
              again!
            </p>
          </div>

          {/* Error details in dev mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold text-red-700 mb-2">
                Debug Info:
              </p>
              <p className="text-sm text-red-600 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="primary"
              size="lg"
              leftIcon={<span>🔄</span>}
            >
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/game')}
              variant="secondary"
              size="lg"
              leftIcon={<span>🎮</span>}
            >
              Back to Lobby
            </Button>
          </div>

          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Return to Home
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
