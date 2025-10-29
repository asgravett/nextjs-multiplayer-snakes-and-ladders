'use client';

import { GameState } from '@/lib/types';
import { GAME_CONFIG, PLAYER_COLORS, COLOR_MAP } from '@/lib/constants';

export default function WaitingRoom({
  gameState,
  isHost,
  roomName,
  onStartGame,
  onLeaveRoom,
}: {
  gameState: GameState;
  isHost: boolean;
  roomName?: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}) {
  const players = Object.values(gameState.players);
  const canStart = players.length >= 2;

  return (
    <div className="py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⏳</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Waiting Room
            </h2>
            {roomName && (
              <p className="text-gray-600">
                Room:{' '}
                <span className="font-semibold text-blue-600">{roomName}</span>
              </p>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-800">
                Players ({players.length}/{GAME_CONFIG.MAX_PLAYERS})
              </h3>
              {isHost && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  👑 You{`'`}re the Host
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200"
                >
                  <span className="font-medium text-gray-800">
                    {player.name}
                  </span>
                  <div
                    className="w-10 h-10 rounded-full border-3 border-white shadow-md flex items-center justify-center text-white font-bold"
                    style={{
                      backgroundColor:
                        COLOR_MAP[
                          PLAYER_COLORS[index % GAME_CONFIG.MAX_PLAYERS]
                        ],
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              ))}
              {[...Array(GAME_CONFIG.MAX_PLAYERS - players.length)].map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300"
                  >
                    <span className="text-gray-400 italic">
                      Waiting for player...
                    </span>
                    <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">?</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-xl font-bold text-lg mb-3 transition-all transform ${
                canStart
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canStart ? '🎮 Start Game' : '⏳ Waiting for more players...'}
            </button>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 p-4 rounded-xl text-center mb-3">
              <p className="font-semibold">
                Waiting for host to start the game...
              </p>
              <p className="text-sm text-blue-600 mt-1">Sit tight! 🎲</p>
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
