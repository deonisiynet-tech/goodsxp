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
      const { name, phone, email, address, city, warehouse, warehouseAddress, comment, paymentMethod, items } = req.body;
      const order = await orderService.create({
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
      });
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id);

      // Перевірка: користувач може бачити тільки своє замовлення, адмін — будь-яке
      if (req.user) {
        if (req.user.role !== 'ADMIN' && order.email !== req.user.email) {
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

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, email } = req.query;
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
    } catch (error) {
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
