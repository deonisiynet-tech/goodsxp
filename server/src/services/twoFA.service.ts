import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Rate limiting для 2FA спроб
 * Максимум 5 невдалих спроб за 15 хвилин
 */
class TwoFARateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 хвилин

  checkAndIncrement(userId: string): void {
    const now = Date.now();
    const record = this.attempts.get(userId);

    // Якщо запису немає або вікно закінчилось — скидаємо
    if (!record || now > record.resetAt) {
      this.attempts.set(userId, { count: 1, resetAt: now + this.WINDOW_MS });
      return;
    }

    // Якщо перевищено ліміт — блокуємо
    if (record.count >= this.MAX_ATTEMPTS) {
      const remainingMs = record.resetAt - now;
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new AppError(
        `Занадто багато невдалих спроб 2FA. Спробуйте через ${remainingMin} хв.`,
        429
      );
    }

    // Інкрементуємо лічильник
    record.count++;
  }

  reset(userId: string): void {
    this.attempts.delete(userId);
  }

  // Cleanup старих записів (викликається періодично)
  cleanup(): void {
    const now = Date.now();
    for (const [userId, record] of this.attempts.entries()) {
      if (now > record.resetAt) {
        this.attempts.delete(userId);
      }
    }
  }
}

const twoFARateLimiter = new TwoFARateLimiter();

// Cleanup кожні 5 хвилин
setInterval(() => twoFARateLimiter.cleanup(), 5 * 60 * 1000);

export class TwoFAService {
  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCode: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFAEnabled: true },
    });

    if (!user) {
      throw new AppError('Користувача не знайдено', 404);
    }

    if (user.twoFAEnabled) {
      throw new AppError('2FA вже увімкнено', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `GoodsXP Admin (${user.email})`,
      issuer: 'GoodsXP',
      length: 20,
    });

    // Ensure otpauth_url is defined
    if (!secret.otpauth_url) {
      throw new AppError('Помилка генерації секрету 2FA', 500);
    }

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret to database (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: secret.base32 },
    });

    return {
      secret: secret.base32!,
      otpauthUrl: secret.otpauth_url,
      qrCode: qrCode as string,
    };
  }

  /**
   * Verify a TOTP token against user's secret
   * Includes rate limiting to prevent brute force attacks
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    // ✅ Rate limiting: перевіряємо кількість спроб
    twoFARateLimiter.checkAndIncrement(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFASecret: true, twoFAEnabled: true },
    });

    if (!user || !user.twoFASecret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before/after for time drift
    });

    // ✅ Якщо успішно — скидаємо лічильник спроб
    if (verified) {
      twoFARateLimiter.reset(userId);
    }

    return verified;
  }

  /**
   * Enable 2FA for a user (after successful verification)
   */
  async enableTwoFA(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new AppError('Невірний код 2FA', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFAEnabled: true },
    });
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFA(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFAEnabled: true, twoFASecret: true },
    });

    if (!user || !user.twoFAEnabled) {
      throw new AppError('2FA не увімкнено', 400);
    }

    // Verify token before disabling
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new AppError('Невірний код 2FA', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFAEnabled: false,
        twoFASecret: null,
      },
    });
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFAEnabled: true },
    });

    return user?.twoFAEnabled ?? false;
  }

  /**
   * Check if user has 2FA secret (even if not enabled)
   */
  async hasTwoFASecret(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFASecret: true },
    });

    return !!user?.twoFASecret;
  }
}

export const twoFAService = new TwoFAService();
