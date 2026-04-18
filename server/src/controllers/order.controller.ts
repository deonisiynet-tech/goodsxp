import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { AdminService } from '../services/admin.service.js';
import { ActionType } from '@prisma/client';

const orderService = new OrderService();
const adminService = new AdminService();

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, email, address, city, warehouse, warehouseAddress, comment, paymentMethod, items, promoCode } = req.body;

      // ✅ Якщо користувач авторизований — прив'язуємо замовлення до його акаунта
      const authReq = req as AuthRequest;
      const userId = authReq.user ? authReq.user.id : undefined;

      // ✅ Retry логіка для race condition при піковому навантаженні
      const MAX_RETRIES = 2;
      let lastError: any;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const order = await orderService.create({
            userId,
            name,
            phone,
            email,
            address,
            city,
            warehouse,
            warehouseAddress,
            comment,
            paymentMethod,
            items,
            promoCode,
          });
          return res.status(201).json(order);
        } catch (err: any) {
          lastError = err;

          // Retry тільки якщо це conflict/stock помилка (не валідація)
          const isRetryable =
            err.message?.includes('недоступний') ||
            err.message?.includes('Товар') ||
            err.code === 'P2034' || // Prisma transaction error
            err.message?.includes('timeout') ||
            err.message?.includes('deadlock');

          if (!isRetryable || attempt === MAX_RETRIES) {
            throw err;
          }

          // ✅ Експоненційна затримка: 100ms, 300ms
          const delay = Math.pow(2, attempt - 1) * 100 + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // Досягаємо сюди тільки якщо всі спроби вичерпані (не повинно статись)
      return res.status(409).json({
        error: lastError?.message || 'Не вдалося створити замовлення. Спробуйте ще раз.',
        retryable: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id);

      // Перевірка: користувач може бачити тільки своє замовлення, адмін — будь-яке
      if (req.user) {
        // ✅ IDOR prevention: перевіряємо userId, а не email
        if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
          return res.status(403).json({ error: 'Недостатньо прав для перегляду цього замовлення' });
        }
      } else {
        // Якщо немає авторизованого користувача — забороняємо
        return res.status(401).json({ error: 'Потрібна авторизація для перегляду замовлення' });
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  /** Отримати замовлення поточного авторизованого користувача */
  async getMyOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { page, limit, status } = req.query;
      const result = await orderService.getMyOrders(userId, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        status: status as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, email } = req.query;

      // ✅ IDOR prevention: звичайні користувачі не мають доступу до всіх замовлень
      // Тільки адмін може бачити всі замовлення
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        return res.status(401).json({ error: 'Потрібна авторизація' });
      }
      if (authReq.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Недостатньо прав для перегляду всіх замовлень' });
      }

      const result = await orderService.getAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        status: status as string,
        email: email as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, email } = req.query;
      const result = await orderService.getAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 100,
        status: status as string,
        email: email as string,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await orderService.updateStatus(id, status);

      // Log the action
      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.UPDATE,
        entity: 'Order',
        entityId: id,
        details: `Updated order status to ${status}`,
        ipAddress: req.ip,
      });

      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.delete(req.params.id);

      // Log the action
      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.DELETE,
        entity: 'Order',
        entityId: req.params.id,
        ipAddress: req.ip,
      });

      res.json(result);
    } catch (error: any) {
      console.error('❌ Order delete error:', error?.message, error?.code, error?.stack);
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await orderService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
