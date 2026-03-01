import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { AuthRequest } from '../middleware/auth.js';

const orderService = new OrderService();

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, email, address, comment, items } = req.body;
      const order = await orderService.create({
        name,
        phone,
        email,
        address,
        comment,
        items,
      });
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id);
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

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await orderService.updateStatus(id, status);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.delete(req.params.id);
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
