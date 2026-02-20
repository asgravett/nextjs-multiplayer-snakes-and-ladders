'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, CardContent } from '@/components/ui';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center space-y-6">
          {/* Fun 404 Icon */}
          <div className="text-8xl">🐍❓</div>

          {/* Title */}
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-600 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-500">
              Oops! Looks like you slid down a snake to a page that doesn&apos;t
              exist.
            </p>
          </div>

          {/* Helpful suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold text-blue-700 mb-2">
              Looking for something?
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
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
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Go back to previous page
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
