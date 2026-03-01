import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { processImageUpload } from '../middleware/upload.js';

const productService = new ProductService();

export class ProductController {
  // Public routes
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      const result = await productService.getAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
        sortBy: sortBy as 'createdAt' | 'price' | 'title',
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  // Admin routes
  async getAllAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;
      const result = await productService.getAllAdmin({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
        sortBy: sortBy as 'createdAt' | 'price' | 'title',
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, price, stock, isActive } = req.body;
      
      let imageUrl = '';

      // Handle image upload
      if (req.files?.image) {
        const file = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
        imageUrl = await processImageUpload(file);
      }

      const product = await productService.create({
        title,
        description,
        price: Number(price),
        imageUrl: imageUrl || null,
        images: imageUrl ? [imageUrl] : [],
        stock: stock ? Number(stock) : 0,
        isActive: isActive === 'true',
      });

      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, price, stock, isActive } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price) updateData.price = Number(price);
      if (stock !== undefined) updateData.stock = Number(stock);
      if (isActive !== undefined) updateData.isActive = isActive === 'true';

      // Handle image upload
      if (req.files?.image) {
        const file = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
        updateData.imageUrl = await processImageUpload(file);
      }

      const product = await productService.update(id, updateData);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.delete(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
