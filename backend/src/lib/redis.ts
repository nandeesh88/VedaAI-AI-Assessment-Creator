import { Redis, RedisOptions } from 'ioredis';

let redisInstance: Redis | null = null;

function buildRedisOptions(redisUrl: string): RedisOptions {
  if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
    throw new Error('REDIS_URL must start with redis:// or rediss://');
  }

  const parsed = new URL(redisUrl);
  const db = parsed.pathname ? Number(parsed.pathname.replace('/', '')) : 0;
  const isTls = parsed.protocol === 'rediss:';

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: Number.isFinite(db) ? db : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10000,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
    reconnectOnError() {
      return true;
    },
    tls: isTls
      ? {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        }
      : undefined,
  };
}

export function getRedisConnectionOptions(): RedisOptions {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }
  return buildRedisOptions(redisUrl);
}

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(getRedisConnectionOptions());

    redisInstance.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisInstance.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisInstance.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    redisInstance.on('close', () => {
      console.warn('[Redis] Connection closed');
    });

    redisInstance.on('reconnecting', () => {
      console.warn('[Redis] Reconnecting...');
    });
  }

  return redisInstance;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  const redis = getRedis();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const val = await redis.get(key);
  if (!val) return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}
