'use client';

export default function DiceRoller({
  onRoll,
  disabled = false,
}: {
  onRoll: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center">
      <button
        onClick={onRoll}
        disabled={disabled}
        className={`
          w-full px-8 py-4 rounded-xl font-bold text-base tracking-wide
          transition-all duration-200 ease-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120]
          ${
            disabled
              ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/6'
              : 'bg-linear-to-r from-cyan-500 to-cyan-400 text-gray-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:from-cyan-400 hover:to-cyan-300 active:scale-[0.97] animate-pulse-glow'
          }
        `}
        aria-label="Roll dice"
      >
        🎲 Roll Dice
      </button>
    </div>
  );
}
