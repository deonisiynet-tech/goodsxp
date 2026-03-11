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
      const { title, description, price, stock, isActive, images } = req.body;

      let imageUrl: string | undefined = undefined;
      let imagesArray: string[] = [];

      // Handle multiple image uploads
      if (req.files?.images) {
        const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const file of files) {
          const uploadedUrl = await processImageUpload(file);
          if (uploadedUrl) imagesArray.push(uploadedUrl);
        }
      }

      // Use first image as imageUrl for backward compatibility
      if (imagesArray.length > 0) {
        imageUrl = imagesArray[0];
      }

      // Also check if images were sent as JSON string (from FormData)
      if (!imagesArray.length && images) {
        try {
          const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
          if (Array.isArray(parsedImages)) {
            imagesArray = parsedImages;
            imageUrl = imagesArray[0];
          }
        } catch (e) {
          console.error('Error parsing images JSON:', e);
        }
      }

      const product = await productService.create({
        title,
        description,
        price: Number(price),
        imageUrl: imageUrl || undefined,
        images: imagesArray,
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
      const { title, description, price, stock, isActive, images } = req.body;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price) updateData.price = Number(price);
      if (stock !== undefined) updateData.stock = Number(stock);
      if (isActive !== undefined) updateData.isActive = isActive === 'true';

      let imagesArray: string[] = [];

      // Handle multiple image uploads (new files)
      if (req.files?.images) {
        const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
        for (const file of files) {
          const uploadedUrl = await processImageUpload(file);
          if (uploadedUrl) imagesArray.push(uploadedUrl);
        }
      }

      // Check if images were sent as JSON string (from FormData)
      if (images) {
        try {
          const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
          if (Array.isArray(parsedImages)) {
            imagesArray = parsedImages;
          }
        } catch (e) {
          console.error('Error parsing images JSON:', e);
        }
      }

      // Use first image as imageUrl for backward compatibility
      if (imagesArray.length > 0) {
        updateData.imageUrl = imagesArray[0];
        updateData.images = imagesArray;
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
