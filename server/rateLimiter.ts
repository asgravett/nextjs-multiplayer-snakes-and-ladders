import { RateLimiterMemory } from 'rate-limiter-flexible';
import type { Server } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '@/lib/socketEvents';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const RATE_LIMIT_POINTS = Number(process.env.RATE_LIMIT_POINTS) || 20;
const RATE_LIMIT_DURATION = Number(process.env.RATE_LIMIT_DURATION) || 1;
const RATE_LIMIT_BLOCK = Number(process.env.RATE_LIMIT_BLOCK) || 5;

const rateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_POINTS,
  duration: RATE_LIMIT_DURATION,
  blockDuration: RATE_LIMIT_BLOCK,
});

export function applyRateLimiting(io: TypedServer): void {
  io.use(async (socket, next) => {
    try {
      await rateLimiter.consume(socket.handshake.address);
      next();
    } catch {
      next(new Error('Rate limit exceeded'));
    }
  });
}
