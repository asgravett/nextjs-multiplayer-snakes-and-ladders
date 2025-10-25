import GameBoard from '@/components/GameBoard';
import GameClient from '@/components/GameClient';

export const dynamic = 'force-static';

export default function GamePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="relative">
        <GameBoard />
        <GameClient />
      </div>
    </main>
  );
}
