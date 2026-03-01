'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, CardContent } from '@/components/ui';

interface GameErrorBoundaryProps {
  children: ReactNode;
  onLeaveGame?: () => void;
  roomId?: string;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GameErrorBoundary extends Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<GameErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Game Error:', error, errorInfo);

    // TODO: Log to Sentry or other monitoring service
    // Sentry.captureException(error, { extra: { errorInfo } });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleLeaveGame = (): void => {
    this.props.onLeaveGame?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <Card variant="elevated" className="max-w-md mx-auto mt-8">
          <CardContent className="text-center space-y-4">
            <div className="text-5xl">🎮💥</div>

            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                Game Error
              </h2>
              <p className="text-slate-400">
                Something went wrong with the game. You can try to continue or
                leave the room.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-left">
                <p className="text-xs font-mono text-rose-300 break-all">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="primary">
                🔄 Retry
              </Button>
              <Button onClick={this.handleLeaveGame} variant="danger">
                🚪 Leave Game
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

export default GameErrorBoundary;
