'use client';

export default function DiceRoller({ onRoll }: { onRoll: () => void }) {
  return (
    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2">
      <button
        onClick={onRoll}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
        aria-label="Roll dice"
      >
        Roll Dice 🎲
      </button>
    </div>
  );
}
