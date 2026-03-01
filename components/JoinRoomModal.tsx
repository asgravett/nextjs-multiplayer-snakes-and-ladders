'use client';

import { useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks';

export default function JoinRoomModal({
  isOpen,
  roomName,
  onClose,
  onJoin,
}: {
  isOpen: boolean;
  roomName: string;
  onClose: () => void;
  onJoin: (playerName: string) => void;
}) {
  const [playerName, setPlayerName] = useLocalStorage('snl_player_name', '');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside the dialog while open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoin(playerName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-room-title"
        className="relative bg-white/6 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-w-md w-full p-8 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Close"
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
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎮</span>
          </div>
          <h2
            id="join-room-title"
            className="text-2xl font-bold text-slate-100 mb-2"
          >
            Join Room
          </h2>
          <p className="text-slate-400">
            You{`'`}re joining{' '}
            <span className="font-semibold text-cyan-400">{roomName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              What{`'`}s your name?
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all text-base"
              autoFocus
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              This name will be visible to other players
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/7 text-slate-300 border border-white/10 rounded-xl hover:bg-white/12 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!playerName.trim()}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                playerName.trim()
                  ? 'bg-linear-to-r from-cyan-500 to-cyan-400 text-gray-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 active:scale-[0.97]'
                  : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/6'
              }`}
            >
              Join Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
