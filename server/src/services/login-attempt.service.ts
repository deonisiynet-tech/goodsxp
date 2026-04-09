import getRedisClient from '../prisma/redis.js';

// In-memory fallback when Redis is not available
const memoryStore = new Map<string, { count: number; blockedUntil: number | null }>();

const MAX_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RESET_DURATION_MS = 30 * 60 * 1000; // Reset counter after 30 minutes

export class LoginAttemptService {
  private getKey(ip: string): string {
    return `login_attempts:${ip}`;
  }

  private getBlockKey(ip: string): string {
    return `login_blocked:${ip}`;
  }

  /**
   * Check if IP is blocked
   */
  async isBlocked(ip: string): Promise<{ blocked: boolean; remainingTime?: number }> {
    const redis = getRedisClient();

    if (redis) {
      const blockedUntil = await redis.get(this.getBlockKey(ip));
      if (blockedUntil) {
        const blockedTime = parseInt(blockedUntil, 10);
        const now = Date.now();
        if (now < blockedTime) {
          return { blocked: true, remainingTime: blockedTime - now };
        }
        // Block expired, clean up
        await redis.del(this.getBlockKey(ip));
        await redis.del(this.getKey(ip));
      }
      return { blocked: false };
    }

    // In-memory fallback
    const data = memoryStore.get(ip);
    if (data && data.blockedUntil && Date.now() < data.blockedUntil) {
      return { blocked: true, remainingTime: data.blockedUntil - Date.now() };
    }

    if (data && data.blockedUntil && Date.now() >= data.blockedUntil) {
      memoryStore.delete(ip);
    }

    return { blocked: false };
  }

  /**
   * Record a failed login attempt
   */
  async recordFailedAttempt(ip: string): Promise<{ attemptsLeft: number; blocked: boolean }> {
    const redis = getRedisClient();

    if (redis) {
      const key = this.getKey(ip);
      const attempts = await redis.incr(key);

      if (attempts === 1) {
        // Set expiry on first attempt
        await redis.expire(key, Math.floor(RESET_DURATION_MS / 1000));
      }

      if (attempts >= MAX_ATTEMPTS) {
        // Block IP
        const blockedUntil = Date.now() + BLOCK_DURATION_MS;
        await redis.set(this.getBlockKey(ip), blockedUntil.toString(), {
          EX: Math.floor(BLOCK_DURATION_MS / 1000),
        });
        await redis.del(key);
        return { attemptsLeft: 0, blocked: true };
      }

      return { attemptsLeft: MAX_ATTEMPTS - attempts, blocked: false };
    }

    // In-memory fallback
    let data = memoryStore.get(ip) || { count: 0, blockedUntil: null };
    data.count += 1;

    if (data.count >= MAX_ATTEMPTS) {
      data.blockedUntil = Date.now() + BLOCK_DURATION_MS;
      data.count = 0;
      memoryStore.set(ip, data);

      // Auto-unblock after block duration
      setTimeout(() => {
        const current = memoryStore.get(ip);
        if (current && current.blockedUntil && Date.now() >= current.blockedUntil) {
          memoryStore.delete(ip);
        }
      }, BLOCK_DURATION_MS);

      return { attemptsLeft: 0, blocked: true };
    }

    memoryStore.set(ip, data);

    // Auto-reset after reset duration
    setTimeout(() => {
      const current = memoryStore.get(ip);
      if (current) {
        current.count = 0;
        memoryStore.set(ip, current);
      }
    }, RESET_DURATION_MS);

    return { attemptsLeft: MAX_ATTEMPTS - data.count, blocked: false };
  }

  /**
   * Reset attempts on successful login
   */
  async resetAttempts(ip: string): Promise<void> {
    const redis = getRedisClient();

    if (redis) {
      await redis.del(this.getKey(ip));
      await redis.del(this.getBlockKey(ip));
    } else {
      memoryStore.delete(ip);
    }
  }

  /**
   * Get remaining attempts
   */
  async getAttemptsLeft(ip: string): Promise<number> {
    const redis = getRedisClient();

    if (redis) {
      const attempts = await redis.get(this.getKey(ip));
      if (attempts) {
        return Math.max(0, MAX_ATTEMPTS - parseInt(attempts, 10));
      }
      return MAX_ATTEMPTS;
    }

    const data = memoryStore.get(ip);
    if (data) {
      return Math.max(0, MAX_ATTEMPTS - data.count);
    }
    return MAX_ATTEMPTS;
  }
}

export const loginAttemptService = new LoginAttemptService();
