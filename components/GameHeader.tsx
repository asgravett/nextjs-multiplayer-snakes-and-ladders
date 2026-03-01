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
    <header className="glass-bright sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or logo */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Link
                href="/"
                className="text-slate-400 hover:text-cyan-400 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/6 transition-colors"
                aria-label="Go home"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                </svg>
              </Link>
            )}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-100">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-slate-400">{subtitle}</p>
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
