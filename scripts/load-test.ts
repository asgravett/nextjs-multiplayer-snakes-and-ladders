/**
 * Socket.IO Load Test Script
 *
 * Spawns many concurrent clients that create rooms, join games, and play
 * through dice rolls to simulate realistic server load.
 *
 * Usage:
 *   npm run load-test
 *   npm run load-test -- --clients 200 --duration 60
 *
 * Requires the Socket.IO server to be running (`npm run server`).
 */

import { io, Socket } from 'socket.io-client';
import type { GameState, Room, RoomInfo } from '@/lib/types';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '@/lib/socketEvents';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Configuration ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name: string, fallback: number): number {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return parseInt(args[idx + 1], 10);
  return fallback;
}

const SERVER_URL = process.env.SOCKET_URL || 'http://localhost:4000';
const NUM_CLIENTS = getArg('clients', 100);
const RAMP_UP_DELAY_MS = getArg('ramp', 50);
const TEST_DURATION_MS = getArg('duration', 30) * 1000;
const PLAYERS_PER_ROOM = 4; // matches GAME_CONFIG.MAX_PLAYERS

// ─── Stats ───────────────────────────────────────────────────────────────────

interface Stats {
  connected: number;
  connectErrors: number;
  disconnected: number;
  roomsCreated: number;
  roomsJoined: number;
  gamesStarted: number;
  diceRolled: number;
  gamesCompleted: number;
  serverErrors: number;
  messagesReceived: number;
  latencies: number[];
}

const stats: Stats = {
  connected: 0,
  connectErrors: 0,
  disconnected: 0,
  roomsCreated: 0,
  roomsJoined: 0,
  gamesStarted: 0,
  diceRolled: 0,
  gamesCompleted: 0,
  serverErrors: 0,
  messagesReceived: 0,
  latencies: [],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomName(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

function percentile(sorted: number[], p: number): number | string {
  if (sorted.length === 0) return 'N/A';
  const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
  return sorted[idx];
}

// ─── Client lifecycle ───────────────────────────────────────────────────────

const allSockets: TypedSocket[] = [];

/**
 * A "group" is 4 clients that share one room and play a full game together.
 * This reflects real usage better than isolated connections.
 */
async function runGroup(groupIndex: number): Promise<void> {
  const roomName = `LoadRoom-${groupIndex}`;
  const clientId = (i: number) => `load-${groupIndex}-${i}`;
  const playerName = (i: number) => `Bot-${groupIndex}-${i}`;

  // Connect all 4 sockets
  const sockets: TypedSocket[] = [];
  for (let i = 0; i < PLAYERS_PER_ROOM; i++) {
    const socket: TypedSocket = io(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true,
    }) as TypedSocket;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Client ${groupIndex}-${i} connect timeout`));
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        stats.connected++;
        resolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        stats.connectErrors++;
        reject(err);
      });
    });

    socket.on('disconnect', () => stats.disconnected++);
    socket.on('error', () => stats.serverErrors++);
    socket.onAny(() => stats.messagesReceived++);

    sockets.push(socket);
    allSockets.push(socket);
  }

  // ── Step 1: Host creates the room ──
  const host = sockets[0];
  const roomId = await new Promise<string>((resolve) => {
    const start = Date.now();
    host.on('roomJoined', (data: { roomId: string; room: Room }) => {
      stats.latencies.push(Date.now() - start);
      stats.roomsCreated++;
      resolve(data.roomId);
    });
    host.emit('createRoom', {
      roomName,
      playerName: playerName(0),
      clientId: clientId(0),
    });
  });

  // ── Step 2: Remaining players join ──
  for (let i = 1; i < PLAYERS_PER_ROOM; i++) {
    await new Promise<void>((resolve) => {
      const start = Date.now();
      sockets[i].on('roomJoined', () => {
        stats.latencies.push(Date.now() - start);
        stats.roomsJoined++;
        resolve();
      });
      sockets[i].emit('joinRoom', {
        roomId,
        playerName: playerName(i),
        clientId: clientId(i),
      });
    });
    await sleep(50); // small gap between joins
  }

  // ── Step 3 + 4: Start game and play until someone wins ──
  // Register dice-rolling listeners BEFORE emitting startGame so the initial
  // gameState (with currentTurn set) isn't missed.
  await new Promise<void>((resolve) => {
    let gameStarted = false;
    const gameTimeout = setTimeout(() => {
      // If the game doesn't finish in 60s, move on
      resolve();
    }, 60000);

    for (const socket of sockets) {
      socket.on('gameState', (state: GameState) => {
        if (!gameStarted && state.gameStarted) {
          gameStarted = true;
          stats.gamesStarted++;
        }

        if (state.winner) {
          clearTimeout(gameTimeout);
          stats.gamesCompleted++;
          resolve();
          return;
        }

        if (state.currentTurn === socket.id && state.gameStarted) {
          // Short delay to simulate human think time and avoid flooding
          setTimeout(
            () => {
              const start = Date.now();
              stats.diceRolled++;
              socket.emit('rollDice', { roomId });

              socket.once('diceRolled', () => {
                stats.latencies.push(Date.now() - start);
              });
            },
            50 + Math.random() * 100,
          );
        }
      });
    }

    // Now start the game — listeners are already in place
    host.emit('startGame', { roomId });
  });

  // ── Step 5: Leave room ──
  for (const socket of sockets) {
    socket.emit('leaveRoom', { roomId });
    await sleep(20);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function printStats(): void {
  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const avg =
    sorted.length > 0
      ? (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(1)
      : 'N/A';

  console.log('\n\x1b[36m📊 Load Test Results\x1b[0m');
  console.log('═'.repeat(50));
  console.log(`  Clients total:         ${NUM_CLIENTS}`);
  console.log(
    `  Groups (rooms):        ${Math.ceil(NUM_CLIENTS / PLAYERS_PER_ROOM)}`,
  );
  console.log('─'.repeat(50));
  console.log(`  Connected:             ${stats.connected}`);
  console.log(`  Connect errors:        ${stats.connectErrors}`);
  console.log(`  Disconnected:          ${stats.disconnected}`);
  console.log(`  Server errors:         ${stats.serverErrors}`);
  console.log('─'.repeat(50));
  console.log(`  Rooms created:         ${stats.roomsCreated}`);
  console.log(`  Rooms joined:          ${stats.roomsJoined}`);
  console.log(`  Games started:         ${stats.gamesStarted}`);
  console.log(`  Dice rolled:           ${stats.diceRolled}`);
  console.log(`  Games completed:       ${stats.gamesCompleted}`);
  console.log('─'.repeat(50));
  console.log(`  Messages received:     ${stats.messagesReceived}`);
  console.log(`  Latency samples:       ${sorted.length}`);
  console.log(`  Avg latency:           ${avg}ms`);
  console.log(`  P50 latency:           ${percentile(sorted, 0.5)}ms`);
  console.log(`  P95 latency:           ${percentile(sorted, 0.95)}ms`);
  console.log(`  P99 latency:           ${percentile(sorted, 0.99)}ms`);
  console.log('═'.repeat(50));
}

function printProgress(): void {
  process.stdout.write(
    `\r  ✅ ${stats.connected} connected | 🎲 ${stats.diceRolled} rolls | 🏆 ${stats.gamesCompleted} games | ❌ ${stats.connectErrors + stats.serverErrors} errors`,
  );
}

async function run(): Promise<void> {
  console.log(`\n\x1b[33m🚀 Load Test — ${SERVER_URL}\x1b[0m`);
  console.log(
    `   ${NUM_CLIENTS} clients | ${RAMP_UP_DELAY_MS}ms ramp | ${TEST_DURATION_MS / 1000}s duration\n`,
  );

  const numGroups = Math.ceil(NUM_CLIENTS / PLAYERS_PER_ROOM);

  // Progress ticker
  const progressInterval = setInterval(printProgress, 500);

  // Launch groups with ramp-up delay between each
  const groupPromises: Promise<void>[] = [];
  for (let g = 0; g < numGroups; g++) {
    groupPromises.push(
      runGroup(g).catch((err) => {
        stats.connectErrors++;
        if (stats.connectErrors <= 3) {
          console.error(`\n  ⚠️  Group ${g} failed: ${err.message}`);
        }
      }),
    );
    await sleep(RAMP_UP_DELAY_MS * PLAYERS_PER_ROOM);
  }

  // Wait for all groups to finish or test duration, whichever comes first
  await Promise.race([
    Promise.allSettled(groupPromises),
    sleep(TEST_DURATION_MS),
  ]);

  clearInterval(progressInterval);
  process.stdout.write('\n');

  // Cleanup
  console.log('\n  🧹 Disconnecting all clients...');
  allSockets.forEach((s) => s.disconnect());
  await sleep(1000);

  printStats();
  process.exit(0);
}

run().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
