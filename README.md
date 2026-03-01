# 🎲 Multiplayer Snakes and Ladders

A real-time multiplayer Snakes and Ladders game for 2–4 players. Rooms are created on demand, game state lives in Redis, and players reconnect transparently across network hiccups.

🔗 **[Play it live](https://nextjs-multiplayer-snakes-and-ladde.vercel.app/)**

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Socket Events Reference](#socket-events-reference)
- [Game Mechanics](#game-mechanics)
- [Reconnection & Resilience](#reconnection--resilience)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)
- [Testing](#testing)
- [Load Testing](#load-testing)
- [Hosting & Deployment](#hosting--deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Error Monitoring](#error-monitoring)
- [Scaling](#scaling)
- [Assets](#assets)

---

## Tech Stack

| Layer               | Technology                                                |
| ------------------- | --------------------------------------------------------- |
| Frontend framework  | Next.js 16 (App Router)                                   |
| UI library          | React 19                                                  |
| Language            | TypeScript                                                |
| Styling             | Tailwind CSS v4                                           |
| Real-time transport | Socket.IO v4 (WebSocket only)                             |
| Server runtime      | Node.js 24.8.0                                            |
| State store         | Redis 5 (via `redis` client + `@socket.io/redis-adapter`) |
| Validation          | Zod 4                                                     |
| Error monitoring    | Sentry (`@sentry/nextjs`)                                 |
| Testing             | Jest 30, ts-jest, @testing-library/react                  |
| Load testing        | Artillery 2, custom TypeScript script                     |
| Rate limiting       | `rate-limiter-flexible`                                   |
| Build tooling       | tsx (dev), tsc + tsc-alias (prod)                         |

---

## Architecture Overview

The application is split into **two independent processes**:

```
Browser
  │
  │  HTTP / SSR (port 3000)
  ▼
┌─────────────────────┐
│   Next.js App       │  Vercel
│   (App Router)      │
│   SSR + static      │
└─────────────────────┘
         │
         │  WebSocket (port 4000)
         ▼
┌─────────────────────┐
│  Socket.IO Server   │  Railway
│  (Node.js / tsx)    │
│  handlers.ts        │
│  roomManager.ts     │
└──────────┬──────────┘
           │
           │  TCP
           ▼
┌─────────────────────┐
│       Redis         │  Railway add-on / Redis Cloud
│  - Room state JSON  │
│  - S.IO pub/sub     │
└─────────────────────┘
```

- The **Next.js app** serves the UI and handles SSR/SSG. It never touches Redis directly.
- The **Socket.IO server** owns all game logic. It is the single source of truth.
- **Redis** stores every room as a JSON string keyed `room:<roomId>`, with a configurable TTL (default 1 hour). It also carries the Socket.IO pub/sub bus so multiple server instances can broadcast to the same rooms.

---

## Project Structure

```
.
├── app/                        # Next.js App Router pages
│   ├── game/page.tsx           # Main game page (lobby → waiting room → game)
│   ├── layout.tsx              # Root layout, fonts, metadata
│   └── ...
├── components/                 # React UI components
│   ├── CanvasBoardGame.tsx     # HTML5 Canvas game board
│   ├── GameClient.tsx          # In-game HUD (dice, player cards)
│   ├── Lobby.tsx               # Room browser / create form
│   ├── WaitingRoom.tsx         # Pre-game lobby
│   ├── WinCelebration.tsx      # Win modal
│   ├── LoseCelebration.tsx     # Lose modal
│   └── ui/                     # Generic design-system components
├── hooks/
│   ├── useGameSocket.ts        # All Socket.IO wiring + state
│   ├── usePlayerAnimation.ts   # Canvas animation state machine
│   ├── useResponsiveCanvas.ts  # Canvas DPI / resize handling
│   ├── useLocalStorage.ts      # Generic localStorage hook
│   └── useSocketErrorBoundary.ts
├── lib/
│   ├── constants.ts            # Board layout, snake/ladder map, game config
│   ├── gameErrors.ts           # Typed error classes + error codes
│   ├── logic.ts                # Pure game logic (rollDice, applyRoll)
│   ├── socketEvents.ts         # Typed event interfaces + Zod payload schemas
│   ├── types.ts                # Shared TypeScript types (Player, Room, GameState)
│   └── validation.ts           # Server-side guard validators
├── server/
│   ├── server.ts               # HTTP server + Socket.IO setup + Redis adapter
│   ├── handlers.ts             # All socket event handlers
│   ├── roomManager.ts          # RoomManager class — CRUD + turn/disconnect logic
│   ├── redis.ts                # Redis client creation + connection
│   └── rateLimiter.ts          # Connection-level rate limiter middleware
├── __tests__/                  # Mirrors source structure
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── server/
├── artillery/                  # Artillery load-test YAML configs
├── scripts/load-test.ts        # Custom Socket.IO load test script
├── notes/                      # Internal design docs (scaling, CI/CD checklist)
└── .github/workflows/          # GitHub Actions CI/CD pipeline
```

---

## Data Flow

### 1. Initial connection

```
Browser → Socket.IO connect
Server  → roomsList([...])        # current rooms snapshot
```

### 2. Creating a room

```
Client → createRoom { roomName, playerName, clientId }
Server   validates payload (Zod) + rate limit
Server   roomManager.create()  →  Redis SET room:<id>
Server → roomJoined { roomId, room }   (to creator)
Server → roomsList([...])              (broadcast)
```

### 3. Joining a room

```
Client → joinRoom { roomId, playerName, clientId }
Server   validates: room exists, not full, not started
Server   roomManager.addPlayer()  →  Redis SET
Server → roomJoined { roomId, room }   (to joiner)
Server → gameState(...)                (broadcast to room)
Server → roomsList([...])              (broadcast)
```

### 4. Starting the game

```
Client (host) → startGame { roomId }
Server   validates: caller is host, ≥2 players, not already started
Server   sets gameState.gameStarted = true, currentTurn = playerOrder[0]
Server → gameState(...)   (broadcast to room)
Server → roomsList([...]) (broadcast)
```

### 5. Rolling the dice

```
Client → rollDice { roomId }
Server   validates: game started, no winner, it is this player's turn
Server   roll = random 1-6
Server   newPosition = applyRoll(currentPosition, roll)
           — checks SNAKES_AND_LADDERS map
           — caps at 100 (exact landing required to win)
Server   advances currentTurn to next active player
Server → gameState(...)    (broadcast to room)
Server → diceRolled { playerId, roll, newPosition }  (broadcast to room)
Server → gameWon { winner } if position === 100       (broadcast to room)
```

### 6. Disconnect mid-game

```
Socket disconnects
Server   marks player as disconnected (roomManager.markPlayerDisconnected)
Server   if it was their turn → advance to next active player
Server   if they were host → transfer host to next connected player
Server → gameState(...)   (broadcast to room — others see "disconnected" badge)
Server   starts 2-minute eviction timer keyed by clientId
```

### 7. Rejoining

```
Client connects (new socket, same clientId from localStorage)
Client → rejoinRoom { roomId, clientId }
Server   finds player by clientId, verifies disconnected flag
Server   cancels eviction timer
Server   roomManager.reconnectPlayer(oldSocketId, newSocketId)
           — remaps player entry to new socket ID
           — if currentTurn was null (all disconnected), restores it
Server → roomJoined { roomId, room }   (to rejoining socket)
Server → gameState(...)                (broadcast to room)
```

---

## Socket Events Reference

### Client → Server

| Event        | Payload                              | Description                             |
| ------------ | ------------------------------------ | --------------------------------------- |
| `createRoom` | `{ roomName, playerName, clientId }` | Create a new game room                  |
| `joinRoom`   | `{ roomId, playerName, clientId }`   | Join an existing room                   |
| `leaveRoom`  | `{ roomId }`                         | Leave a room voluntarily                |
| `rejoinRoom` | `{ roomId, clientId }`               | Reconnect after a disconnect            |
| `startGame`  | `{ roomId }`                         | Host starts the game                    |
| `rollDice`   | `{ roomId }`                         | Roll the dice (only valid on your turn) |
| `resetGame`  | `{ roomId }`                         | Host resets the board for a rematch     |

### Server → Client

| Event          | Payload                           | Description                  |
| -------------- | --------------------------------- | ---------------------------- |
| `roomsList`    | `RoomInfo[]`                      | Live list of all rooms       |
| `roomJoined`   | `{ roomId, room }`                | Confirmed room entry         |
| `roomLeft`     | —                                 | Confirmed room exit          |
| `gameState`    | `GameState`                       | Full game state snapshot     |
| `diceRolled`   | `{ playerId, roll, newPosition }` | Dice roll result             |
| `gameWon`      | `{ winner }`                      | Game over — winner name      |
| `gameReset`    | —                                 | Board was reset              |
| `hostChanged`  | `{ newHostId }`                   | Host transferred             |
| `rejoinFailed` | `{ reason }`                      | Could not rejoin             |
| `error`        | `{ message }`                     | Structured error from server |

All payloads are validated with Zod schemas defined in `lib/socketEvents.ts`. Errors are typed with `GameError` (code + message) from `lib/gameErrors.ts`.

---

## Game Mechanics

- **Board:** 100 squares, players start at square 1 and must reach exactly 100 to win.
- **Dice:** Standard 1–6. Overshooting 100 keeps the player at their current position.
- **Snakes & Ladders:** 15 squares have special effects. Landing on a ladder moves you up; landing on a snake moves you down. The map is defined in `lib/constants.ts`.
- **Turn order:** Set at game start from `playerOrder`. Disconnected players are automatically skipped.
- **Max players:** 4 per room; max 250 rooms per server instance default.
- **Player colours:** Red, blue, green, yellow (assigned by join order).

---

## Reconnection & Resilience

- A `clientId` is generated once and stored in `localStorage` (`snl_client_id`).
- The current `roomId` is persisted to `localStorage` (`snl_rejoin_room_id`) on every `roomJoined` event.
- On reconnect, `useGameSocket` automatically emits `rejoinRoom` with both values.
- The server grants a **2-minute grace period** before permanently evicting a disconnected player. If they reconnect within that window, the game resumes as if nothing happened.
- If all players disconnect simultaneously (e.g. both had a page reload), `currentTurn` becomes `null`. The first player to reconnect causes it to be restored to the first active player.

---

## Local Setup

### Prerequisites

- Node.js 24.8.0 (`nvm use` or install from [nodejs.org](https://nodejs.org))
- Redis 7+ running locally (see options below)

### Running Redis locally

Pick whichever option suits your environment:

**Docker (recommended — no install required)**

```bash
docker run -d --name snl-redis -p 6379:6379 redis:alpine
# Stop later with: docker stop snl-redis
```

**macOS (Homebrew)**

```bash
brew install redis
brew services start redis   # runs in background, auto-starts on login
# or one-off: redis-server
```

**Windows (WSL2 recommended)**

```bash
# Inside WSL2:
sudo apt update && sudo apt install redis-server
sudo service redis-server start
```

**Windows (native)**

Download and install the [Memurai](https://www.memurai.com/) Redis-compatible server (free for dev), or use the unofficial [Redis for Windows](https://github.com/microsoftarchive/redis/releases) binaries.

**Verify Redis is running**

```bash
redis-cli ping
# → PONG
```

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd nextjs-multiplayer-snakes-and-ladders
npm install

# 2. Configure environment
cp .env.example .env.local        # Next.js client env
# edit .env.local — set NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# 3. Ensure Redis is running (see above)

# 4. Start the Socket.IO server (terminal 1)
npm run server

# 5. Start Next.js dev server (terminal 2)
npm run dev
```

Visit `http://localhost:3000`. Open a second browser tab to play against yourself.

---

## Environment Variables

### Frontend — `.env.local`

| Variable                 | Default                 | Description                            |
| ------------------------ | ----------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | WebSocket server URL                   |
| `NEXT_PUBLIC_SENTRY_DSN` | —                       | Sentry DSN for browser error reporting |
| `NEXT_PUBLIC_SITE_URL`   | `http://localhost:3000` | Base URL used for Open Graph metadata  |

### Backend — set on Railway (or exported in shell)

| Variable              | Default                  | Description                                     |
| --------------------- | ------------------------ | ----------------------------------------------- |
| `PORT`                | `4000`                   | Port the Socket.IO server listens on            |
| `CORS_ORIGIN`         | `http://localhost:3000`  | Allowed frontend origin                         |
| `REDIS_URL`           | `redis://localhost:6379` | Redis connection string                         |
| `SENTRY_DSN`          | —                        | Sentry DSN for server-side error reporting      |
| `ROOM_TTL`            | `3600`                   | Room expiry time in seconds                     |
| `MAX_ROOMS`           | `250`                    | Maximum concurrent rooms allowed on the server  |
| `PING_INTERVAL`       | `30000`                  | Socket.IO heartbeat interval (ms)               |
| `PING_TIMEOUT`        | `25000`                  | Socket.IO heartbeat timeout (ms)                |
| `RATE_LIMIT_POINTS`   | `20`                     | Max connection events per window                |
| `RATE_LIMIT_DURATION` | `1`                      | Rate limit window in seconds                    |
| `RATE_LIMIT_BLOCK`    | `5`                      | Block duration in seconds after exceeding limit |

---

## NPM Scripts

| Script                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `npm run dev`                 | Next.js development server with hot reload                  |
| `npm run server`              | Socket.IO server via `tsx` (dev, with path alias support)   |
| `npm run server:build`        | Compile Socket.IO server to `dist/` via `tsc` + `tsc-alias` |
| `npm run server:start`        | Run the compiled server from `dist/server/server.js`        |
| `npm run build`               | Next.js production build                                    |
| `npm run start`               | Next.js production server                                   |
| `npm run test`                | Run all Jest tests                                          |
| `npm run test:watch`          | Jest in interactive watch mode                              |
| `npm run test:coverage`       | Jest with coverage report (outputs to `coverage/`)          |
| `npm run lint`                | ESLint across the codebase                                  |
| `npm run load-test`           | Custom TypeScript load test against the Socket.IO server    |
| `npm run load-test:artillery` | Artillery load test (`artillery/socket-load-test.yml`)      |

---

## Testing

Tests live in `__tests__/` mirroring the source tree.

```bash
npm run test              # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with HTML coverage report in coverage/
```

### Coverage areas

| Area        | File(s)                                 |
| ----------- | --------------------------------------- |
| Game logic  | `__tests__/lib/logic.test.ts`           |
| Validation  | `__tests__/lib/validation.test.ts`      |
| Error types | `__tests__/lib/gameErrors.test.ts`      |
| RoomManager | `__tests__/server/roomManager.test.ts`  |
| Socket hook | `__tests__/hooks/useGameSocket.test.ts` |
| Components  | `__tests__/components/*.test.tsx`       |

Jest is configured via `jest.config.js` using `next/jest` for correct module resolution and path alias (`@/`) support. Test environment is `jest-environment-jsdom`. Server-side tests mock Redis with an in-memory `Map`.

---

## Load Testing

### Artillery

```bash
# Full load test (configured in artillery/socket-load-test.yml)
npm run load-test:artillery

# Quick 5-second smoke test
node node_modules/.bin/artillery run artillery/quick-test.yml
```

### Custom TypeScript script

```bash
# Simulates concurrent players creating rooms, joining, and rolling dice
npm run load-test
```

Set `SOCKET_URL` to point at a non-local server:

```bash
SOCKET_URL=https://your-server.railway.app npm run load-test
```

---

## Hosting & Deployment

| Service     | What it hosts                                                 |
| ----------- | ------------------------------------------------------------- |
| **Vercel**  | Next.js frontend (automatic deployments via Vercel CLI in CI) |
| **Railway** | Socket.IO server (Docker-based, `npm run server:start`)       |
| **Redis**   | Railway Redis add-on or Redis Cloud                           |

### Production build & run

```bash
# Frontend
npm run build
npm run start               # or let Vercel handle it

# Backend
npm run server:build        # compiles to dist/
npm run server:start        # runs dist/server/server.js
```

### Health check

The Socket.IO server exposes a health endpoint:

```
GET http://<server>:<port>/health
→ 200 { "status": "ok" }
```

Railway's health check probes this endpoint before routing traffic.

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci-cd.yml`.

### On push to `main`

```
Install dependencies
       ↓
Lint (ESLint) + Test (Jest --ci --coverage)
       ↓
Build frontend (Next.js)  ← parallel →  Build backend (tsc)
       ↓
Deploy frontend (Vercel)  ← parallel →  Deploy backend (Railway)
       ↓
Notify (GitHub commit status)
```

### On pull request against `main`

Only **lint + test** run. Build and deploy are skipped.

### Required GitHub Secrets

| Secret              | Used for                                     |
| ------------------- | -------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel CLI deployment                        |
| `VERCEL_ORG_ID`     | Vercel project scoping                       |
| `VERCEL_PROJECT_ID` | Vercel project scoping                       |
| `RAILWAY_TOKEN`     | Railway CLI deployment                       |
| `SENTRY_AUTH_TOKEN` | Sentry source map upload during `next build` |

---

## Error Monitoring

[Sentry](https://sentry.io) is integrated on all three runtimes:

| Runtime                     | Config file                 |
| --------------------------- | --------------------------- |
| Browser (client components) | `instrumentation-client.ts` |
| Next.js server (Node.js)    | `sentry.server.config.ts`   |
| Next.js edge runtime        | `sentry.edge.config.ts`     |

In production, 10% of transactions are sampled (`tracesSampleRate: 0.1`). In development, all transactions are captured (`tracesSampleRate: 1`).

---

## Scaling

The server is ready for **horizontal scaling** today:

- All game state is stored in Redis, not in process memory.
- The `@socket.io/redis-adapter` carries pub/sub events between instances so any server can broadcast to any room regardless of which instance a player's socket is connected to.
- Transport is locked to WebSocket-only (`transports: ['websocket']`), so sticky sessions are **not** required at the load balancer.

---

## Assets

Board artwork used in this project:

<a href="https://www.vectorstock.com/royalty-free-vector/snake-and-ladder-rocket-adventure-vector-8154064" target="_blank">Vector image by VectorStock / vable</a>
