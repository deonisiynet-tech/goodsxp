import { Request } from 'express';
import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { getClientIp } from '../utils/getClientIp.js';
import { geoService } from './geo.service.js';

interface SessionData {
  id: string;
  device: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export class SessionService {
  /**
   * Hash JWT token for storage (security: don't store plaintext tokens)
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse user-agent string to extract device info
   */
  private parseDevice(userAgent: string | undefined): string {
    if (!userAgent) return 'Unknown Device';

    // Extract browser
    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browser = 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      browser = 'Opera';
    }

    // Extract OS
    let os = 'Unknown OS';
    if (userAgent.includes('Windows NT 10.0')) {
      os = 'Windows 10/11';
    } else if (userAgent.includes('Windows NT 6.3')) {
      os = 'Windows 8.1';
    } else if (userAgent.includes('Windows NT 6.2')) {
      os = 'Windows 8';
    } else if (userAgent.includes('Windows NT 6.1')) {
      os = 'Windows 7';
    } else if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    }

    return `${browser} on ${os}`;
  }

  /**
   * Create a new session record on login
   * Returns sessionId for inclusion in JWT
   */
  async createSession(userId: string, token: string, req: Request): Promise<string> {
    const tokenHash = this.hashToken(token);
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const device = this.parseDevice(userAgent);

    // Отримати геолокацію
    const geo = await geoService.getLocation(ipAddress);
    const location = geoService.formatLocation(geo);

    // Calculate expiry (7 days to match JWT)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.adminSession.create({
      data: {
        userId,
        sessionToken: tokenHash,
        ipAddress,
        userAgent: userAgent || null,
        device,
        location,  // Зберегти геолокацію
        expiresAt,
      },
    });

    return session.id;  // Повернути sessionId
  }

  /**
   * Update last active timestamp for a session
   */
  async updateLastActive(token: string): Promise<void> {
    if (!token) return;

    const tokenHash = this.hashToken(token);

    try {
      await prisma.adminSession.update({
        where: { sessionToken: tokenHash },
        data: { lastActive: new Date() },
      });
    } catch (error) {
      // Session might not exist (e.g., old token) - silently ignore
      console.debug('Session not found for token update:', tokenHash.substring(0, 8));
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getSessions(userId: string, currentToken?: string): Promise<SessionData[]> {
    const sessions = await prisma.adminSession.findMany({
      where: {
        userId,
        expiresAt: { gte: new Date() }, // Only active sessions
      },
      orderBy: { lastActive: 'desc' },
      select: {
        id: true,
        sessionToken: true,
        device: true,
        ipAddress: true,
        location: true,
        lastActive: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    const currentTokenHash = currentToken ? this.hashToken(currentToken) : null;

    return sessions.map((session) => ({
      id: session.id,
      device: session.device,
      ipAddress: session.ipAddress,
      location: session.location,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionToken === currentTokenHash,
    }));
  }

  /**
   * Delete a specific session (with ownership check)
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      throw new AppError('Сесію не знайдено', 404);
    }

    if (session.userId !== userId) {
      throw new AppError('Доступ заборонено', 403);
    }

    await prisma.adminSession.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Delete session by token (used on logout)
   */
  async deleteSessionByToken(token: string): Promise<void> {
    if (!token) return;

    const tokenHash = this.hashToken(token);

    try {
      await prisma.adminSession.delete({
        where: { sessionToken: tokenHash },
      });
    } catch (error) {
      // Session might not exist - silently ignore
      console.debug('Session not found for deletion:', tokenHash.substring(0, 8));
    }
  }

  /**
   * Logout from all devices except current
   */
  async deleteAllExceptCurrent(userId: string, currentToken: string): Promise<number> {
    const currentTokenHash = this.hashToken(currentToken);

    const result = await prisma.adminSession.deleteMany({
      where: {
        userId,
        sessionToken: { not: currentTokenHash },
      },
    });

    return result.count;
  }

  /**
   * Cleanup expired sessions (run via cron)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.adminSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired sessions`);
    }

    return result.count;
  }

  /**
   * Get session count for a user
   */
  async getSessionCount(userId: string): Promise<number> {
    return await prisma.adminSession.count({
      where: {
        userId,
        expiresAt: { gte: new Date() },
      },
    });
  }
}

export const sessionService = new SessionService();
