'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0b1120] text-[#f1f5f9] flex items-center justify-center p-4">
          <Card variant="elevated" className="max-w-md w-full">
            <CardContent className="text-center space-y-6">
              {/* Error Icon */}
              <div className="text-8xl">🪜💥</div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-slate-100 mb-2">
                  Something Went Wrong
                </h1>
                <p className="text-slate-400">
                  The ladder broke! We&apos;re sorry, but something unexpected
                  happened.
                </p>
              </div>

              {/* Error details in dev mode */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left">
                  <p className="text-sm font-semibold text-rose-400 mb-2">
                    Error Details:
                  </p>
                  <p className="text-sm text-rose-300 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-rose-400/60 mt-2">
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
