import prisma from '../prisma/client.js';
import { LogLevel, LogSource } from '@prisma/client';

export interface LogEntry {
  level: LogLevel;
  message: string;
  userId?: string;
  ipAddress?: string;
  source: LogSource;
  metadata?: Record<string, any>;
}

export class LoggerService {
  /**
   * Log a message to the system logs
   */
  async log(data: LogEntry): Promise<void> {
    try {
      await prisma.systemLog.create({
        data: {
          level: data.level,
          message: data.message,
          userId: data.userId,
          ipAddress: data.ipAddress,
          source: data.source,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });
    } catch (error: any) {
      // Silently fail if logging fails (avoid infinite loops)
      console.warn('⚠️ Failed to write log:', error.message);
    }
  }

  /**
   * Log an INFO level message
   */
  async info(message: string, options?: Omit<LogEntry, 'level'>): Promise<void> {
    await this.log({ level: LogLevel.INFO, message, source: LogSource.SYSTEM, ...options });
  }

  /**
   * Log a WARNING level message
   */
  async warn(message: string, options?: Omit<LogEntry, 'level'>): Promise<void> {
    await this.log({ level: LogLevel.WARNING, message, source: LogSource.SYSTEM, ...options });
  }

  /**
   * Log an ERROR level message
   */
  async error(message: string, options?: Omit<LogEntry, 'level'>): Promise<void> {
    await this.log({ level: LogLevel.ERROR, message, source: LogSource.SYSTEM, ...options });
  }

  /**
   * Log admin panel action
   */
  async adminAction(message: string, userId?: string, ipAddress?: string): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message,
      userId,
      ipAddress,
      source: LogSource.ADMIN_PANEL,
    });
  }

  /**
   * Log API request
   */
  async apiRequest(message: string, userId?: string, ipAddress?: string): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message,
      userId,
      ipAddress,
      source: LogSource.API,
    });
  }

  /**
   * Log system event
   */
  async systemEvent(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message,
      source: LogSource.SYSTEM,
      metadata,
    });
  }

  /**
   * Log error event
   */
  async systemError(message: string, userId?: string, ipAddress?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      message,
      userId,
      ipAddress,
      source: LogSource.SYSTEM,
      metadata,
    });
  }

  /**
   * Get system logs with pagination and filters
   */
  async getSystemLogs(filters: {
    page?: number;
    limit?: number;
    level?: LogLevel;
    source?: LogSource;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 50, level, source, search, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (level) where.level = level;
    if (source) where.source = source;
    if (search) {
      where.message = { contains: search, mode: 'insensitive' };
    }
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Clear all system logs
   */
  async clearLogs(): Promise<{ count: number }> {
    const result = await prisma.systemLog.deleteMany();
    return { count: result.count };
  }

  /**
   * Get logs statistics
   */
  async getStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, byLevel, bySource] = await Promise.all([
      prisma.systemLog.count({
        where: { timestamp: { gte: startDate } },
      }),
      prisma.systemLog.groupBy({
        by: ['level'],
        _count: true,
        where: { timestamp: { gte: startDate } },
      }),
      prisma.systemLog.groupBy({
        by: ['source'],
        _count: true,
        where: { timestamp: { gte: startDate } },
      }),
    ]);

    return {
      total,
      byLevel: byLevel.reduce((acc, item) => {
        acc[item.level] = item._count;
        return acc;
      }, {} as Record<string, number>),
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export singleton instance
export const logger = new LoggerService();
