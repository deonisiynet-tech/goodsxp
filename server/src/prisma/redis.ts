import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let initialized = false;

/**
 * Get Redis client instance with lazy initialization.
 * If REDIS_URL is not configured, returns null (in-memory fallback).
 * If connection fails, returns null without throwing.
 */
export const getRedisClient = (): RedisClientType | null => {
  if (initialized) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    // Redis not configured — silent fallback to in-memory
    initialized = true;
    return null;
  }

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    // Mark as unavailable if connection fails
    redisClient = null;
    initialized = true;
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  // Try to connect synchronously — actual connection happens in background
  redisClient.connect().catch((err) => {
    console.error('❌ Failed to connect to Redis:', err.message);
    redisClient = null;
  });

  initialized = true;
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
