import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#0b1120',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Snakes & Ladders – Free Multiplayer Online Board Game',
    template: '%s | Snakes & Ladders',
  },
  description:
    'Play the classic Snakes and Ladders board game online with friends. Create a room, invite 2–4 players, and race to square 100 in real-time.',
  keywords: [
    'snakes and ladders',
    'multiplayer board game',
    'online board game',
    'free game',
    'board game',
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ),
  openGraph: {
    title: 'Snakes & Ladders – Multiplayer Online',
    description: 'Create a room. Invite friends. Race to 100!',
    url: '/',
    siteName: 'Snakes & Ladders',
    type: 'website',
    images: [
      {
        url: '/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Snakes & Ladders game board',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snakes & Ladders – Multiplayer Online',
    description: 'Play the classic board game with friends in real-time',
    images: ['/assets/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
