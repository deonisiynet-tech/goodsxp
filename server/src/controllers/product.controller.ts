import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { processImageUpload } from '../middleware/upload.js';
import { AdminService } from '../services/admin.service.js';
import { ActionType } from '@prisma/client';
import prisma from '../prisma/client.js';
import { productSchema, sanitizeHtml } from '../utils/validators.js';

const productService = new ProductService();
const adminService = new AdminService();

export class ProductController {
  // Public routes
  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.getAllCategories();
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  async getRelated(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { limit = 4 } = req.query;
      const product = await productService.getById(productId);
      if (!product.categoryId) {
        return res.json({ products: [] });
      }
      const products = await productService.getByCategory(
        product.categoryId,
        Number(limit),
        productId
      );
      res.json({ products });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, sortBy, sortOrder, category, featured, minPrice, maxPrice } = req.query;
      const result = await productService.getAll({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
        sortBy: sortBy as 'createdAt' | 'price' | 'title',
        sortOrder: sortOrder as 'asc' | 'desc',
        category: category as string,
        featured: featured as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Batch fetch — отримати багато товарів одним запитом по масиву ID
  async getBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
        return res.status(400).json({ error: 'Потрібен масив ID (1-100)' });
      }

      const products = await prisma.product.findMany({
        where: { id: { in: ids }, isActive: true },
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          discountPrice: true,
          imageUrl: true,
          stock: true,
        },
      });

      res.json({ products });
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

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getBySlug(req.params.slug);

      // ✅ Якщо був редірект — повертаємо 301 з новим slug
      if (result.redirectedFrom) {
        res.setHeader('Location', `/catalog/${result.product.slug}`);
        return res.status(301).json({
          redirected: true,
          newSlug: result.product.slug,
          newUrl: `/catalog/${result.product.slug}`,
          product: result.product,
        });
      }

      res.json(result.product);
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
      let { title, description, price, margin, originalPrice, discountPrice, stock, isActive, images, isFeatured, isPopular, categoryId } = req.body;

      // ✅ Санітизація HTML для запобігання XSS
      if (title && typeof title === 'string') title = sanitizeHtml(title);
      if (description && typeof description === 'string') description = sanitizeHtml(description);

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
        margin: margin !== undefined ? Number(margin) : 0,
        categoryId: categoryId || null,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        discountPrice: discountPrice ? Number(discountPrice) : null,
        imageUrl: imageUrl || undefined,
        images: imagesArray,
        stock: stock ? Number(stock) : 0,
        isActive: isActive !== 'false', // Default to true unless explicitly 'false'
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isPopular: isPopular === 'true' || isPopular === true,
      });

      // Log the action
      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.CREATE,
        entity: 'Product',
        entityId: product.id,
        details: `Created product: ${title}`,
        ipAddress: req.ip,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      let { title, description, price, margin, stock, isActive, images, categoryId, isFeatured, isPopular, originalPrice, discountPrice } = req.body;

      // ✅ Санітизація HTML для запобігання XSS
      if (title && typeof title === 'string') title = sanitizeHtml(title);
      if (description && typeof description === 'string') description = sanitizeHtml(description);

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (margin !== undefined) updateData.margin = Number(margin);
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (stock !== undefined) updateData.stock = Number(stock);
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
      if (isPopular !== undefined) updateData.isPopular = isPopular === 'true' || isPopular === true;
      if (originalPrice !== undefined) updateData.originalPrice = originalPrice ? Number(originalPrice) : null;
      if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? Number(discountPrice) : null;

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

      // Log the action
      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.UPDATE,
        entity: 'Product',
        entityId: id,
        details: `Updated product: ${title || id}`,
        ipAddress: req.ip,
      });

      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.getById(req.params.id);
      const result = await productService.delete(req.params.id);

      // Log the action
      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.DELETE,
        entity: 'Product',
        entityId: req.params.id,
        details: `Deleted product: ${product.title}`,
        ipAddress: req.ip,
      });

      res.json(result);
    } catch (error) {
      console.error('Delete product error:', error);
      next(error);
    }
  }

  // Review methods
  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { sortBy } = req.query as { sortBy?: 'newest' | 'best' | 'worst' };
      const reviews = await productService.getReviews(id, { sortBy });
      res.json({ reviews });
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, rating, comment } = req.body;

      // Validate rating
      const ratingNum = Number(rating);
      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Рейтинг має бути від 1 до 5' });
      }

      const review = await productService.createReview(id, { name, rating: ratingNum, comment });
      res.status(201).json(review);
    } catch (error: any) {
      if (error.message.includes('не знайдено') || error.message.includes('Товар')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Рейтинг')) {
        return res.status(400).json({ message: error.message });
      }
      console.error('Create review error:', error);
      next(error);
    }
  }

  // Review methods by slug — делегує до основних методів через ID
  async getReviewsBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { sortBy } = req.query as { sortBy?: 'newest' | 'best' | 'worst' };

      const result = await productService.getBySlug(slug);
      const reviews = await productService.getReviews(result.product.id, { sortBy });
      res.json({ reviews });
    } catch (error) {
      next(error);
    }
  }

  async createReviewBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { name, rating, comment } = req.body;

      // Validate rating
      const ratingNum = Number(rating);
      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Рейтинг має бути від 1 до 5' });
      }

      const result = await productService.getBySlug(slug);
      const review = await productService.createReview(result.product.id, { name, rating: ratingNum, comment });
      res.status(201).json(review);
    } catch (error: any) {
      if (error.message.includes('не знайдено') || error.message.includes('Товар')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Рейтинг')) {
        return res.status(400).json({ message: error.message });
      }
      console.error('Create review by slug error:', error);
      next(error);
    }
  }
}
