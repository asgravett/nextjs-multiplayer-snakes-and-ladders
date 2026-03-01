'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call optional error handler (e.g., for Sentry)
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card variant="elevated" className="max-w-lg w-full">
            <CardContent className="text-center space-y-6">
              {/* Error Icon */}
              <div className="text-6xl">😵</div>

              {/* Error Title */}
              <div>
                <h1 className="text-2xl font-bold text-slate-100 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-slate-400">
                  We&apos;re sorry, but something unexpected happened. Please
                  try again.
                </p>
              </div>

              {/* Error Details (optional) */}
              {showDetails && error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-rose-400 mb-2">
                    Error Details:
                  </p>
                  <p className="text-sm text-rose-300 font-mono break-all">
                    {error.message}
                  </p>
                  {errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-sm text-rose-400/70 cursor-pointer hover:text-rose-300">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-rose-400/60 mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset} variant="primary" size="lg">
                  🔄 Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="secondary"
                  size="lg"
                >
                  🔃 Reload Page
                </Button>
              </div>

              {/* Help Link */}
              <p className="text-sm text-slate-500">
                If the problem persists,{' '}
                <Link
                  href="/"
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                >
                  return to the home page
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
