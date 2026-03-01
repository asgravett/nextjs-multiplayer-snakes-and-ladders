import Link from 'next/link';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Snakes & Ladders – Multiplayer Online',
  description:
    'Play the classic Snakes and Ladders board game online with friends. Create a room, invite 2–4 players, and race to square 100 in real-time.',
  applicationCategory: 'GameApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-125 h-125 rounded-full bg-cyan-500/7 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 rounded-full bg-violet-500/7 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-75 h-75 rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-20">
        {/* Hero */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Free to play &middot; No sign-up required
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            <span className="bg-linear-to-r from-cyan-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              Snakes & Ladders
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-xl mx-auto">
            The classic board game, reimagined for real-time multiplayer
          </p>
        </div>

        {/* Feature cards */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="group rounded-2xl bg-white/4 backdrop-blur-xl border border-white/8 p-6 hover:bg-white/7 hover:border-cyan-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl mb-4 group-hover:shadow-lg group-hover:shadow-cyan-500/10 transition-shadow">
                👥
              </div>
              <h3 className="font-bold text-slate-100 mb-1">2–4 Players</h3>
              <p className="text-sm text-slate-400">
                Create a room and play with friends in real-time
              </p>
            </div>
            <div className="group rounded-2xl bg-white/4 backdrop-blur-xl border border-white/8 p-6 hover:bg-white/7 hover:border-violet-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl mb-4 group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-shadow">
                🎲
              </div>
              <h3 className="font-bold text-slate-100 mb-1">Instant Play</h3>
              <p className="text-sm text-slate-400">
                No downloads, no accounts — just join and roll
              </p>
            </div>
            <div className="group rounded-2xl bg-white/4 backdrop-blur-xl border border-white/8 p-6 hover:bg-white/7 hover:border-emerald-500/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-4 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-shadow">
                ⚡
              </div>
              <h3 className="font-bold text-slate-100 mb-1">Live Updates</h3>
              <p className="text-sm text-slate-400">
                Smooth animations and real-time game state sync
              </p>
            </div>
          </div>
        </div>

        {/* How to play */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="rounded-2xl bg-white/4 backdrop-blur-xl border border-white/8 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              How to Play
            </h2>
            <div className="grid gap-4">
              {[
                {
                  step: '1',
                  title: 'Create or Join',
                  desc: 'Start a new room or join an existing one from the lobby.',
                },
                {
                  step: '2',
                  title: 'Wait for Players',
                  desc: 'At least 2 players needed. Up to 4 can join.',
                },
                {
                  step: '3',
                  title: 'Roll & Move',
                  desc: 'Take turns rolling the die. Land on ladders to climb, avoid snakes.',
                },
                {
                  step: '4',
                  title: 'Reach 100',
                  desc: 'First player to square 100 wins! Overshoot and you bounce back.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-sm font-bold text-cyan-400">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{title}</h3>
                    <p className="text-sm text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/game"
            className="group relative inline-flex items-center gap-3 bg-linear-to-r from-cyan-500 to-cyan-400 text-gray-950 text-lg font-bold px-10 py-4 rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 active:scale-[0.97]"
          >
            Start Playing
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            No account needed — play instantly
          </p>
        </div>
      </div>
    </div>
  );
}
