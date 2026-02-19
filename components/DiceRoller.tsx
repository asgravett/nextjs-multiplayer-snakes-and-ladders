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
        className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors ${
          disabled
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        aria-label="Roll dice"
      >
        Roll Dice 🎲
      </button>
    </div>
  );
}
