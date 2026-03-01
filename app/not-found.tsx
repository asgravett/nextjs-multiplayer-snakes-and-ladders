'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center space-y-6">
          {/* Fun 404 Icon */}
          <div className="text-8xl">🐍❓</div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-slate-400 mb-4">
              Page Not Found
            </h2>
            <p className="text-slate-500">
              Oops! Looks like you slid down a snake to a page that doesn&apos;t
              exist.
            </p>
          </div>

          {/* Helpful suggestions */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-cyan-400 mb-2">
              Looking for something?
            </p>
            <ul className="text-sm text-cyan-300/70 space-y-1">
              <li>🏠 Go to the home page</li>
              <li>🎮 Start or join a game</li>
              <li>🔙 Go back to where you were</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push('/')}
              variant="primary"
              size="lg"
              leftIcon={<span>🏠</span>}
            >
              Home
            </Button>
            <Button
              onClick={() => router.push('/game')}
              variant="secondary"
              size="lg"
              leftIcon={<span>🎮</span>}
            >
              Play Game
            </Button>
          </div>

          {/* Back link */}
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-2"
          >
            ← Go back to previous page
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
