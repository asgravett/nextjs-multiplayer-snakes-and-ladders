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
                className="text-gray-600 hover:text-gray-800 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                title="Home"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                </svg>
              </Link>
            )}
            <div className="flex items-center gap-3">
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
