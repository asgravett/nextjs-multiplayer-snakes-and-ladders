import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const pubClient: RedisClient = createClient({ url: REDIS_URL });
export const subClient: RedisClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('[Redis pub] Error:', err));
subClient.on('error', (err) => console.error('[Redis sub] Error:', err));

/**
 * Connect both pub/sub Redis clients.
 * Must be called before the Socket.IO server starts listening.
 */
export async function connectRedis(): Promise<void> {
  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log(`Redis connected at ${REDIS_URL}`);
}
