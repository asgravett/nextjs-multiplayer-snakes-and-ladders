'use client';

import { useState } from 'react';
import JoinRoomModal from './JoinRoomModal';

type RoomInfo = {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  gameStarted: boolean;
};

export default function Lobby({
  availableRooms,
  onCreateRoom,
  onJoinRoom,
}: {
  availableRooms: RoomInfo[];
  onCreateRoom: (roomName: string, playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<RoomInfo | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && playerName.trim()) {
      onCreateRoom(roomName.trim(), playerName.trim());
      setRoomName('');
      setPlayerName('');
      setShowCreateForm(false);
    }
  };

  const handleJoinClick = (room: RoomInfo) => {
    setJoiningRoom(room);
    setJoinModalOpen(true);
  };

  const handleJoinConfirm = (playerName: string) => {
    if (joiningRoom) {
      onJoinRoom(joiningRoom.id, playerName);
      setJoinModalOpen(false);
      setJoiningRoom(null);
    }
  };

  const handleJoinCancel = () => {
    setJoinModalOpen(false);
    setJoiningRoom(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create Room Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">✨</span>
                  New Room
                </h2>
              </div>

              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  + Create New Room
                </button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Room Name
                    </label>
                    <input
                      type="text"
                      placeholder="Epic Game Room"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="Player 1"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {availableRooms.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Rooms</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {availableRooms.reduce(
                        (sum, r) => sum + r.playerCount,
                        0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Players Online</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">🎮</span>
                  Available Rooms
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 font-medium">Live</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {availableRooms.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-gray-500 text-lg mb-2">
                      No rooms available
                    </p>
                    <p className="text-gray-400">Create one to get started!</p>
                  </div>
                ) : (
                  availableRooms.map((room) => {
                    const isFull = room.playerCount >= room.maxPlayers;
                    const isInProgress = room.gameStarted;
                    const canJoin = !isFull && !isInProgress;

                    return (
                      <div
                        key={room.id}
                        className={`bg-gradient-to-r ${
                          selectedRoom === room.id
                            ? 'from-blue-50 to-purple-50 border-blue-300'
                            : 'from-gray-50 to-gray-100 border-gray-200'
                        } border-2 rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer`}
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-xl text-gray-800">
                                {room.name}
                              </h3>
                              {isInProgress && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                  In Progress
                                </span>
                              )}
                              {isFull && !isInProgress && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                  Full
                                </span>
                              )}
                            </div>

                            {/* Player Count */}
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex -space-x-2">
                                {[...Array(room.playerCount)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm"
                                    style={{
                                      backgroundColor: [
                                        '#EF4444',
                                        '#3B82F6',
                                        '#10B981',
                                        '#F59E0B',
                                      ][i % 4],
                                    }}
                                  >
                                    {i + 1}
                                  </div>
                                ))}
                                {[
                                  ...Array(room.maxPlayers - room.playerCount),
                                ].map((_, i) => (
                                  <div
                                    key={`empty-${i}`}
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 bg-gray-100 flex items-center justify-center"
                                  >
                                    <span className="text-gray-400 text-xs">
                                      ?
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <span className="text-gray-600 font-medium">
                                {room.playerCount}/{room.maxPlayers} Players
                              </span>
                            </div>

                            {/* Room Status */}
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  canJoin ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              ></div>
                              <span className="text-sm text-gray-500">
                                {canJoin
                                  ? 'Ready to join'
                                  : isInProgress
                                  ? 'Game in progress'
                                  : 'Room full'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinClick(room);
                            }}
                            disabled={!canJoin}
                            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
                              canJoin
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isInProgress ? (
                              <span className="flex items-center gap-2">
                                🎮 Playing
                              </span>
                            ) : isFull ? (
                              <span className="flex items-center gap-2">
                                🔒 Full
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                ➜ Join
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 inline-block">
            <p className="text-white/90 text-sm">
              💡 <strong>Tip:</strong> Need 2-4 players to start a game
            </p>
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={joinModalOpen}
        roomName={joiningRoom?.name || ''}
        onClose={handleJoinCancel}
        onJoin={handleJoinConfirm}
      />
    </div>
  );
}
