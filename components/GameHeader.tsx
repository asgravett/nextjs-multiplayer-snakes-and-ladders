'use client';

import Link from 'next/link';

export default function GameHeader({
  showBackButton = true,
  title = 'Game Lobby',
  subtitle,
  actions,
}: {
  showBackButton?: boolean;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or logo */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 flex items-center gap-2 font-medium transition-colors group"
              >
                <svg
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-2xl">
                <span>🎲</span>
                <span>🪜</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      </div>
    </header>
  );
}
