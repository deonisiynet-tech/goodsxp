import prisma from '../prisma/client.js';

export type LoginLogData = {
  userId?: string;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
};

export class LoginLogService {
  /**
   * Log a login attempt (success or failure)
   */
  async log(data: LoginLogData): Promise<void> {
    try {
      await prisma.loginLog.create({
        data: {
          userId: data.userId || null,
          email: data.email,
          success: data.success,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          failureReason: data.failureReason || null,
        },
      });
    } catch (error: any) {
      console.error('Failed to log login attempt:', error.message);
    }
  }

  /**
   * Get recent login logs with pagination
   */
  async getLogs(options: {
    limit?: number;
    offset?: number;
    email?: string;
    success?: boolean;
  } = {}): Promise<{ logs: any[]; total: number }> {
    const { limit = 50, offset = 0, email, success } = options;

    const where: any = {};
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (success !== undefined) where.success = success;

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          email: true,
          success: true,
          ipAddress: true,
          userAgent: true,
          failureReason: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.loginLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get failed login attempts count for an email in the last hour
   */
  async getRecentFailedAttempts(email: string, hours = 1): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return prisma.loginLog.count({
      where: {
        email,
        success: false,
        createdAt: { gte: since },
      },
    });
  }
}

export const loginLogService = new LoginLogService();
