import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let initialized = false;
let connecting = false;
const MAX_RECONNECT_DELAY = 30000; // 30s max backoff
let reconnectAttempt = 0;

/**
 * Get Redis client instance with lazy initialization.
 * If REDIS_URL is not configured, returns null (in-memory fallback).
 * If connection fails, returns null without throwing.
 *
 * 🔒 SECURITY: Proper connection handling with reattempt on error.
 */
export const getRedisClient = (): RedisClientType | null => {
  // Already initialized — return current state
  if (initialized) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    // Redis not configured — silent fallback to in-memory
    initialized = true;
    return null;
  }

  if (connecting) {
    // Connection in progress — return null, caller will retry
    return null;
  }

  connecting = true;

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    // 🔒 Don't set initialized=true on error — allow reconnection
    connecting = false;
    redisClient = null;
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
    reconnectAttempt = 0; // Reset backoff on successful connect
  });

  redisClient.on('ready', () => {
    initialized = true;
    connecting = false;
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
    connecting = false;
  });

  // 🔒 Try to connect — catch errors but allow reconnection
  redisClient.connect().catch((err) => {
    console.error('❌ Failed to connect to Redis:', err.message);
    connecting = false;
    redisClient = null;
    // Don't set initialized=true — allow next call to retry
  });

  return redisClient;
};

/**
 * Reset initialization state (useful for testing).
 */
export const resetRedisClient = () => {
  redisClient = null;
  initialized = false;
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('🔌 Redis connection closed');
  }
  redisClient = null;
  initialized = false;
};

export default getRedisClient;
