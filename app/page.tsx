import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🎲 Snakes and Ladders 🪜
          </h1>
          <p className="text-2xl text-white/90 font-semibold">
            Multiplayer Online Edition
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to the Classic Board Game!
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Experience the timeless excitement of Snakes and Ladders in a
              modern, multiplayer format! Play with friends from anywhere in the
              world in real-time. Race to the top of the board, climb ladders to
              advance quickly, but watch out for those sneaky snakes that will
              send you sliding back down!
            </p>
          </section>

          {/* Game Description */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              About the Game
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Snakes and Ladders is a beloved board game that has entertained
              families for generations. In this online version, you can create
              or join rooms with up to 4 players, take turns rolling the dice,
              and navigate the 100-square board filled with surprises.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Multiplayer
                </h3>
                <p className="text-gray-600 text-sm">
                  Play with 2-4 players in real-time
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Easy to Play
                </h3>
                <p className="text-gray-600 text-sm">
                  Simple rules, endless fun
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl mb-2">🌐</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Online Rooms
                </h3>
                <p className="text-gray-600 text-sm">
                  Create or join game rooms
                </p>
              </div>
            </div>
          </section>

          {/* Game Rules */}
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              How to Play
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ol className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-gray-800">
                      Create or Join a Room:
                    </strong>{' '}
                    Start by creating a new game room or joining an existing one
                    from the lobby.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-gray-800">Wait for Players:</strong>{' '}
                    The game requires at least 2 players to start. Wait in the
                    lobby until enough players join.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-gray-800">
                      Take Turns Rolling:
                    </strong>{' '}
                    Players take turns rolling a six-sided die. Move your piece
                    forward by the number of squares shown on the die.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    4
                  </span>
                  <div>
                    <strong className="text-gray-800">Ladders & Snakes:</strong>{' '}
                    Landing on a ladder square lets you climb up to a higher
                    square. Landing on a snake's head sends you sliding down to
                    its tail.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    5
                  </span>
                  <div>
                    <strong className="text-gray-800">Reach Square 100:</strong>{' '}
                    The first player to reach or pass square 100 wins the game!
                    If you roll past 100, you bounce back.
                  </div>
                </li>
              </ol>
            </div>

            {/* Additional Rules */}
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <span className="text-2xl mr-2">⚡</span>
                Quick Tips
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>You start at square 0 (before the board)</li>
                <li>Players move in a fixed turn order</li>
                <li>The game board has 100 squares arranged in a 10×10 grid</li>
                <li>
                  Movement follows a zigzag pattern: left-to-right, then
                  right-to-left
                </li>
                <li>
                  Only the room host can start a new game or reset after winning
                </li>
              </ul>
            </div>
          </section>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/game"
              className="inline-block bg-linear-to-r from-blue-500 to-purple-600 text-white text-xl font-bold px-12 py-4 rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
            >
              🎮 Start Playing Now!
            </Link>
            <p className="text-gray-600 mt-4">
              No downloads required • Play in your browser • Free to play
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/80">
          <p>Built with Next.js and Socket.IO</p>
        </div>
      </div>
    </div>
  );
}
