import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play Game',
  description:
    'Join the multiplayer Snakes and Ladders lobby — create a room or join friends for a real-time board game session.',
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Preload the board image so it's ready when the canvas renders */}
      <link
        rel="preload"
        as="image"
        href="/assets/board.webp"
        type="image/webp"
      />
      {children}
    </>
  );
}
