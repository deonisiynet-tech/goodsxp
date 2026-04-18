import prisma from '../prisma/client.js';
import * as cron from 'node-cron';

export class LogCleanupService {
  private static cronJob: cron.ScheduledTask | null = null;

  // Константи retention policy
  private static readonly RETENTION_DAYS = 30;
  private static readonly MAX_LOGS_PER_TABLE = 2000;

  /**
   * Видалення логів старіших за RETENTION_DAYS днів
   */
  static async cleanupOldLogs(): Promise<{ adminLogs: number; systemLogs: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    console.log(`🧹 Cleanup: Видалення логів старіших за ${cutoffDate.toISOString()}`);

    const [adminResult, systemResult] = await Promise.all([
      prisma.adminLog.deleteMany({
        where: { createdAt: { lt: cutoffDate } }
      }),
      prisma.systemLog.deleteMany({
        where: { timestamp: { lt: cutoffDate } }
      })
    ]);

    console.log(`✅ Видалено: ${adminResult.count} AdminLog, ${systemResult.count} SystemLog`);

    return {
      adminLogs: adminResult.count,
      systemLogs: systemResult.count
    };
  }

  /**
   * Обмеження кількості логів до MAX_LOGS_PER_TABLE
   */
  static async enforceLogLimit(): Promise<{ adminLogs: number; systemLogs: number }> {
    let adminDeleted = 0;
    let systemDeleted = 0;

    // AdminLog limit
    const adminCount = await prisma.adminLog.count();
    if (adminCount > this.MAX_LOGS_PER_TABLE) {
      const toDelete = adminCount - this.MAX_LOGS_PER_TABLE;

      // Знайти ID найстаріших записів
      const oldestAdminLogs = await prisma.adminLog.findMany({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
        take: toDelete
      });

      const result = await prisma.adminLog.deleteMany({
        where: { id: { in: oldestAdminLogs.map(log => log.id) } }
      });

      adminDeleted = result.count;
      console.log(`✅ AdminLog: видалено ${adminDeleted} найстаріших записів (було ${adminCount})`);
    }

    // SystemLog limit
    const systemCount = await prisma.systemLog.count();
    if (systemCount > this.MAX_LOGS_PER_TABLE) {
      const toDelete = systemCount - this.MAX_LOGS_PER_TABLE;

      const oldestSystemLogs = await prisma.systemLog.findMany({
        select: { id: true },
        orderBy: { timestamp: 'asc' },
        take: toDelete
      });

      const result = await prisma.systemLog.deleteMany({
        where: { id: { in: oldestSystemLogs.map(log => log.id) } }
      });

      systemDeleted = result.count;
      console.log(`✅ SystemLog: видалено ${systemDeleted} найстаріших записів (було ${systemCount})`);
    }

    return { adminLogs: adminDeleted, systemLogs: systemDeleted };
  }

  /**
   * Повний cleanup: time-based + count-based
   */
  static async runCleanup(): Promise<void> {
    try {
      console.log('🧹 Запуск log cleanup...');

      const timeBasedResult = await this.cleanupOldLogs();
      const countBasedResult = await this.enforceLogLimit();

      console.log('✅ Log cleanup завершено:', {
        timeBasedDeleted: timeBasedResult,
        countBasedDeleted: countBasedResult
      });
    } catch (error) {
      console.error('❌ Log cleanup failed:', error);
    }
  }

  /**
   * Запуск cron job (кожні 12 годин)
   */
  static startCronJob(): void {
    if (this.cronJob) {
      console.log('⚠️ Cron job вже запущено');
      return;
    }

    // Cron expression: 0 */12 * * * = кожні 12 годин
    this.cronJob = cron.schedule('0 */12 * * *', async () => {
      console.log('⏰ Cron: Запуск log cleanup...');
      await this.runCleanup();
    });

    console.log('✅ Log cleanup cron job запущено (кожні 12 годин)');
  }

  /**
   * Зупинка cron job
   */
  static stopCronJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('🛑 Log cleanup cron job зупинено');
    }
  }
}
