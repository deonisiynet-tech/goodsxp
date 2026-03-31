import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { LoggerService } from '../services/logger.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { ActionType, LogLevel, LogSource } from '@prisma/client';
import { prisma } from '../prisma/config.js';

const adminService = new AdminService();
const loggerService = new LoggerService();

export class AdminController {
  // ==================== USERS ====================
  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, role, search } = req.query;
      const result = await adminService.getAllUsers({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        role: role as string,
        search: search as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await adminService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await adminService.updateUserRole(id, role);

      // Log action
      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.UPDATE,
        entity: 'User',
        entityId: id,
        details: `Role changed to ${role}`,
        ipAddress: req.ip,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async resetUserPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const user = await adminService.resetUserPassword(id, password);

      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.PASSWORD_RESET,
        entity: 'User',
        entityId: id,
        ipAddress: req.ip,
      });

      res.json({ message: 'Пароль скинуто', user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteUser(req.params.id);

      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.DELETE,
        entity: 'User',
        entityId: req.params.id,
        ipAddress: req.ip,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ==================== STATS ====================
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const stats = await adminService.getDashboardStats({
        days: days ? Number(days) : 30,
      });
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== SALES STATS ====================
  async getSalesStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const stats = await adminService.getSalesStats({
        days: days ? Number(days) : 7,
      });
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== TOP PRODUCTS ====================
  async getTopProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const products = await adminService.getTopProducts({
        limit: limit ? Number(limit) : 5,
      });
      res.json(products);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADMIN LOGS ====================
  async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, adminId, action, level, source, search } = req.query;

      // If level or source is specified, use system logs
      if (level || source) {
        const result = await loggerService.getSystemLogs({
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 50,
          level: level as LogLevel,
          source: source as LogSource,
          search: search as string,
        });
        return res.json(result);
      }

      // Otherwise use admin logs (legacy)
      const result = await adminService.getAdminLogs({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        adminId: adminId as string,
        action: action as string,
      });
      res.json(result);
    } catch (error) {
      console.error('❌ Admin.getLogs error:', error);
      next(error);
    }
  }

  // ==================== SYSTEM LOGS ====================
  async getSystemLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, level, source, search, startDate, endDate } = req.query;
      const result = await loggerService.getSystemLogs({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        level: level as LogLevel,
        source: source as LogSource,
        search: search as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async clearLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await loggerService.clearLogs();

      // Log this action
      await loggerService.adminAction(
        'Admin cleared all system logs',
        req.user?.id,
        req.ip as string
      );

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getLogStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { days } = req.query;
      const stats = await loggerService.getStats(days ? Number(days) : 7);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // ==================== SITE SETTINGS ====================
  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.getSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      // ✅ ВАЛІДАЦІЯ: key обов'язковий
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Ключ налаштування обов\'язковий',
        });
      }

      // ✅ ВАЛІДАЦІЯ: value не може бути undefined
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Значення налаштування обов\'язкове',
        });
      }

      const setting = await adminService.updateSetting(key, value, description);

      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.SETTINGS_UPDATE,
        entity: 'SiteSettings',
        entityId: key,
        ipAddress: req.ip,
      });

      res.json(setting);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Оновлення статусу магазину (storeEnabled)
   * Використовується в адмінці для ввімкнення/вимкнення
   */
  async updateStoreEnabled(req: Request, res: Response, next: NextFunction) {
    try {
      const { value } = req.body;
      const adminId = (req as AuthRequest).user?.id;

      console.log('[API] Updating storeEnabled to:', value);

      // ✅ Перевірка значення
      const stringValue = value === 'true' || value === true ? 'true' : 'false';

      // ✅ Оновлюємо або створюємо налаштування
      const setting = await prisma.siteSettings.upsert({
        where: { key: 'storeEnabled' },
        update: { value: stringValue },
        create: {
          key: 'storeEnabled',
          value: stringValue,
          type: 'boolean',
          description: 'Статус магазину (включений/вимкнений)',
        },
      });

      console.log('[API] storeEnabled updated to:', setting.value);

      // ✅ ЛОГУВАННЯ ДІЇ
      if (adminId) {
        try {
          await adminService.logAction({
            adminId,
            action: ActionType.SETTINGS_UPDATE,
            entity: 'SiteSettings',
            entityId: 'storeEnabled',
            details: `Store ${stringValue === 'true' ? 'enabled' : 'disabled'}`,
            ipAddress: req.ip,
          });
        } catch (logError: any) {
          console.warn('⚠️ Failed to log storeEnabled update:', logError.message);
        }
      }

      res.json({ success: true, value: setting.value });
    } catch (error) {
      console.error('[API] Error updating storeEnabled:', error instanceof Error ? error.message : error);
      next(error);
    }
  }

  /**
   * Отримання статусу магазину (storeEnabled)
   * Спеціальний endpoint для middleware - не вимагає авторизації
   */
  async getStoreEnabled(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('[API] Getting storeEnabled status');

      const setting = await prisma.siteSettings.findUnique({
        where: {
          key: 'storeEnabled',
        },
      });

      // ✅ ЯКЩО НЕМАЄ - СТВОРЮЄМО З ЗНАЧЕННЯМ ЗА ЗАМОВЧУВАННЯМ
      if (!setting) {
        console.log('[API] storeEnabled not found, creating with default value: true');
        const newSetting = await prisma.siteSettings.create({
          data: {
            key: 'storeEnabled',
            value: 'true',
            type: 'boolean',
            description: 'Статус магазину (включений/вимкнений)',
          },
        });
        console.log('[API] storeEnabled:', newSetting.value);
        return res.json(newSetting);
      }

      console.log('[API] storeEnabled:', setting.value);

      // ✅ NO CACHE HEADERS - завжди актуальне значення
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(setting);
    } catch (error) {
      console.error('[API] Error getting storeEnabled:', error instanceof Error ? error.message : error);
      next(error);
    }
  }

  async getSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const setting = await adminService.getSetting(req.params.key);

      // ✅ NO CACHE HEADERS - завжди актуальне значення
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(setting);
    } catch (error) {
      next(error);
    }
  }
}
