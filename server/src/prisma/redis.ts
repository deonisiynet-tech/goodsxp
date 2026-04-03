import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType | null => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not configured. Using in-memory fallback.');
    return null;
  }

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  redisClient.connect().catch((err) => {
    console.error('❌ Failed to connect to Redis:', err.message);
    redisClient = null;
  });

  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('🔌 Redis connection closed');
  }
};

export default getRedisClient;
