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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center space-y-6">
          {/* Error Icon */}
          <div className="text-7xl">🎮💔</div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">
              Game Error
            </h1>
            <p className="text-slate-500">
              Something went wrong with the game. Don&apos;t worry, you can try
              again!
            </p>
          </div>

          {/* Error details in dev mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-rose-400 mb-2">
                Debug Info:
              </p>
              <p className="text-sm text-rose-300 font-mono break-all">
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
            className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-2"
          >
            Return to Home
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
