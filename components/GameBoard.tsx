import Image from 'next/image';

export default function GameBoard() {
  return (
    <div className="relative">
      <Image
        src="/assets/board.png"
        alt="Snakes and Ladders game board"
        width={600}
        height={600}
        priority
        className="rounded-lg shadow-lg"
      />
    </div>
  );
}
