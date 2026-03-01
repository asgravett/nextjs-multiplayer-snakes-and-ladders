'use client';

import { Button, Card, CardContent } from '@/components/ui';
import { SocketError } from '@/hooks/useSocketErrorBoundary';

interface ConnectionErrorProps {
  error: SocketError;
  onRetry: () => void;
  onGoHome: () => void;
  isRetrying?: boolean;
}

export default function ConnectionError({
  error,
  onRetry,
  onGoHome,
  isRetrying = false,
}: ConnectionErrorProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'connection':
        return '🔌';
      case 'timeout':
        return '⏱️';
      case 'server':
        return '🖥️';
      default:
        return '❓';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'connection':
        return 'Connection Lost';
      case 'timeout':
        return 'Connection Timeout';
      case 'server':
        return 'Server Error';
      default:
        return 'Connection Error';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'connection':
        return 'Unable to connect to the game server. Please check your internet connection.';
      case 'timeout':
        return 'The server is taking too long to respond. Please try again.';
      case 'server':
        return 'The game server encountered an error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center space-y-6">
          <div className="text-6xl">{getErrorIcon()}</div>

          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">
              {getErrorTitle()}
            </h1>
            <p className="text-slate-400">{getErrorDescription()}</p>
          </div>

          {error.retryCount > 0 && (
            <p className="text-sm text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              Retry attempt {error.retryCount}/3
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onRetry}
              variant="primary"
              size="lg"
              isLoading={isRetrying}
              disabled={error.retryCount >= 3}
            >
              {error.retryCount >= 3 ? '❌ Max Retries' : '🔄 Retry'}
            </Button>
            <Button onClick={onGoHome} variant="secondary" size="lg">
              🏠 Go Home
            </Button>
          </div>

          {error.retryCount >= 3 && (
            <p className="text-sm text-rose-400">
              Maximum retry attempts reached. Please try again later or contact
              support.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
