import { Request } from 'express';
import crypto from 'crypto';
import UAParser from 'ua-parser-js';
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
   * Parse user-agent string to extract device info using ua-parser-js
   * Returns formatted device string with icon and details
   */
  private parseDevice(userAgent: string | undefined): string {
    if (!userAgent) return '❓ Unknown Device';

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const browser = result.browser.name || 'Unknown Browser';
    const browserVersion = result.browser.version ? ` ${result.browser.version.split('.')[0]}` : '';
    let os = result.os.name || 'Unknown OS';
    const osVersion = result.os.version || '';
    const deviceType = result.device.type; // 'mobile', 'tablet', 'desktop', undefined
    const deviceModel = result.device.model || '';
    const deviceVendor = result.device.vendor || '';

    // 🔧 FIX: Android devices often show as "Linux" - correct this
    if (os === 'Linux' && deviceType === 'mobile') {
      os = 'Android';
    }

    // Format device name based on type
    let deviceIcon = '💻'; // Default desktop
    let deviceName = '';

    if (deviceType === 'mobile') {
      deviceIcon = '📱';

      // Try to show model if available
      if (deviceModel) {
        // Clean up model name (remove vendor if it's duplicate)
        const cleanModel = deviceModel.replace(deviceVendor, '').trim();
        deviceName = cleanModel || deviceModel;
      } else if (deviceVendor) {
        deviceName = `${deviceVendor} Phone`;
      } else {
        deviceName = `${os} Phone`;
      }
    } else if (deviceType === 'tablet') {
      deviceIcon = '📱';
      deviceName = deviceModel || `${os} Tablet`;
    } else {
      // Desktop
      deviceIcon = '💻';
      deviceName = os;
      if (osVersion) {
        // Show major version only (e.g., "Windows 10" not "Windows 10.0.19041")
        const majorVersion = osVersion.split('.')[0];
        if (majorVersion && majorVersion !== os) {
          deviceName += ` ${majorVersion}`;
        }
      }
    }

    // Format: "📱 Redmi Note 12 (Chrome, Android)" or "💻 Windows 10 (Chrome)"
    const browserInfo = `${browser}${browserVersion}`;

    if (deviceType === 'mobile' || deviceType === 'tablet') {
      return `${deviceIcon} ${deviceName} (${browserInfo}, ${os})`;
    } else {
      return `${deviceIcon} ${deviceName} (${browserInfo})`;
    }
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
    console.log(`🔍 Attempting to delete session: ${sessionId} for user: ${userId}`);

    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      console.warn(`⚠️ Session not found: ${sessionId}`);
      throw new AppError('Сесію не знайдено', 404);
    }

    if (session.userId !== userId) {
      console.warn(`⚠️ Unauthorized session deletion attempt: ${sessionId} by user: ${userId}`);
      throw new AppError('Доступ заборонено', 403);
    }

    await prisma.adminSession.delete({
      where: { id: sessionId },
    });

    console.log(`✅ Session deleted: ${sessionId}`);
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
