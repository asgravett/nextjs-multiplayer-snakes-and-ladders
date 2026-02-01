'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console (or send to monitoring service)
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card variant="elevated" className="max-w-md w-full">
            <CardContent className="text-center space-y-6">
              {/* Error Icon */}
              <div className="text-8xl">🪜💥</div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Something Went Wrong
                </h1>
                <p className="text-gray-500">
                  The ladder broke! We're sorry, but something unexpected
                  happened.
                </p>
              </div>

              {/* Error details in dev mode */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-semibold text-red-700 mb-2">
                    Error Details:
                  </p>
                  <p className="text-sm text-red-600 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-400 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
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
                  onClick={() => router.push('/')}
                  variant="secondary"
                  size="lg"
                  leftIcon={<span>🏠</span>}
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
