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
        <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card variant="elevated" className="max-w-lg w-full">
            <CardContent className="text-center space-y-6">
              {/* Error Icon */}
              <div className="text-6xl">😵</div>

              {/* Error Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600">
                  We&apos;re sorry, but something unexpected happened. Please
                  try again.
                </p>
              </div>

              {/* Error Details (optional) */}
              {showDetails && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-semibold text-red-700 mb-2">
                    Error Details:
                  </p>
                  <p className="text-sm text-red-600 font-mono break-all">
                    {error.message}
                  </p>
                  {errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-sm text-red-500 cursor-pointer hover:text-red-700">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-red-500 mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
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
              <p className="text-sm text-gray-500">
                If the problem persists,{' '}
                <Link
                  href="/"
                  className="text-blue-500 hover:text-blue-700 underline"
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
