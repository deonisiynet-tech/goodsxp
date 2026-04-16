import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { VariantService } from '../services/variant.service.js';
import { AuthRequest } from '../middleware/auth.js';
import { processImageUpload } from '../middleware/upload.js';
import { AdminService } from '../services/admin.service.js';
import { ActionType } from '@prisma/client';
import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { sanitizeHtml } from '../utils/validators.js';
import path from 'path';

const productService = new ProductService();
const variantService = new VariantService();
const adminService = new AdminService();

const MAX_REVIEW_IMAGES = 5;
const MAX_REVIEW_IMAGE_SIZE = 5 * 1024 * 1024;
const REVIEW_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
const REVIEW_ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

type ReviewSortOption = 'newest' | 'best' | 'worst';

type ReviewUploadFile = {
  name: string;
  mimetype?: string;
  size: number;
  truncated?: boolean;
};

function getReviewFormFiles(req: Request): ReviewUploadFile[] {
  const uploadedFiles = req.files as Record<string, any> | undefined;

  return [uploadedFiles?.reviewImages, uploadedFiles?.images, uploadedFiles?.['images[]']]
    .filter(Boolean)
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
}

function validateReviewFormFiles(files: ReviewUploadFile[]) {
  if (files.length > MAX_REVIEW_IMAGES) {
    throw new AppError(`Можна прикріпити максимум ${MAX_REVIEW_IMAGES} фото`, 400);
  }

  for (const file of files) {
    const extension = path.extname(file.name || '').toLowerCase();
    const mimeType = (file.mimetype || '').toLowerCase();

    if (!REVIEW_ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new AppError('Дозволено тільки JPG, PNG або WebP зображення', 400);
    }

    if (!REVIEW_ALLOWED_EXTENSIONS.has(extension)) {
      throw new AppError('Формат файлу не підтримується. Доступні: JPG, PNG, WebP', 400);
    }

    if (file.truncated || file.size > MAX_REVIEW_IMAGE_SIZE) {
      throw new AppError('Кожне фото повинно бути не більше 5MB', 400);
    }
  }
}

function parseReviewImageUrls(rawImages: unknown): { imageUrl: string }[] {
  if (!rawImages) {
    return [];
  }

  let parsedImages = rawImages;

  if (typeof rawImages === 'string') {
    try {
      parsedImages = JSON.parse(rawImages);
    } catch {
      parsedImages = rawImages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(parsedImages)) {
    return [];
  }

  if (parsedImages.length > MAX_REVIEW_IMAGES) {
    throw new AppError(`Можна прикріпити максимум ${MAX_REVIEW_IMAGES} фото`, 400);
  }

  return parsedImages
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .map((imageUrl) => ({ imageUrl }));
}

async function uploadReviewImages(req: Request): Promise<{ imageUrl: string }[]> {
  const files = getReviewFormFiles(req);

  if (files.length === 0) {
    return parseReviewImageUrls(req.body.images ?? req.body['images[]']);
  }

  validateReviewFormFiles(files);

  const uploadedUrls = await Promise.all(
    files.map(async (file: any) => {
      const imageUrl = await processImageUpload(file);
      return imageUrl ? { imageUrl } : null;
    })
  );

  return uploadedUrls.filter((image): image is { imageUrl: string } => Boolean(image));
}

async function createReviewForProduct(productId: string, req: Request) {
  const ratingNum = Number(req.body.rating);
  const reviewAuthorName = typeof req.body.name === 'string' ? req.body.name.trim() : '';

  if (!productId?.trim()) {
    throw new AppError('productId обовʼязковий', 400);
  }

  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    throw new AppError('Рейтинг має бути від 1 до 5', 400);
  }

  if (!reviewAuthorName) {
    throw new AppError("Ім'я обов'язкове", 400);
  }

  const productExists = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!productExists) {
    throw new AppError('Товар не знайдено', 404);
  }

  const comment = typeof req.body.text === 'string' ? req.body.text : req.body.comment;
  const reviewImages = await uploadReviewImages(req);

  return productService.createReview(productId, {
    name: reviewAuthorName,
    rating: ratingNum,
    comment,
    pros: req.body.pros,
    cons: req.body.cons,
    images: reviewImages.length > 0 ? reviewImages : undefined,
  });
}

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

  /** GET /api/products/search?q=... — autocomplete search suggestions */
  async searchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string)?.trim();
      if (!q || q.length < 2) {
        return res.json({ suggestions: [] });
      }

      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          title: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          originalPrice: true,
          discountPrice: true,
          imageUrl: true,
        },
        orderBy: { title: 'asc' },
        take: 6,
      });

      res.json({ suggestions: products });
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
          _count: {
            select: { variants: true },
          },
        },
      });

      // Додаємо hasVariants + мінімальну ціну з варіантів
      const productsWithVariants = await Promise.all(
        products.map(async (p) => {
          const hasVariants = p._count.variants > 0;
          let minPrice = Number(p.price);

          if (hasVariants) {
            const variants = await prisma.productVariant.findMany({
              where: { productId: p.id },
              select: { price: true },
            });
            if (variants.length > 0) {
              minPrice = Math.min(...variants.map((v) => Number(v.price)));
            }
          }

          const { _count, ...rest } = p;
          return {
            ...rest,
            hasVariants,
            minPrice: hasVariants ? minPrice : undefined,
          };
        })
      );

      res.json({ products: productsWithVariants });
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

  async getSpecifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const specifications = await productService.getSpecifications(id);
      res.json({ specifications });
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

  async saveSpecification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const specification = await productService.saveSpecification(id, {
        id: req.body.id,
        key: req.body.key,
        value: req.body.value,
      });

      await adminService.logAction({
        adminId: req.user!.id,
        action: req.body.id ? ActionType.UPDATE : ActionType.CREATE,
        entity: 'ProductSpecification',
        entityId: specification.id,
        details: `${req.body.id ? 'Updated' : 'Created'} specification "${specification.key}" for product ${id}`,
        ipAddress: req.ip,
      });

      res.status(req.body.id ? 200 : 201).json(specification);
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
      const { sortBy, page, limit } = req.query as { sortBy?: ReviewSortOption; page?: string; limit?: string };

      const options: { sortBy?: ReviewSortOption; page?: number; limit?: number } = { sortBy };
      if (page) options.page = Number(page);
      if (limit) options.limit = Number(limit);

      const result = await productService.getReviews(id, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const review = await createReviewForProduct(id, req);
      /*

      // Validate rating
      const ratingNum = Number(rating);
      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Рейтинг має бути від 1 до 5' });
      }

      // Process uploaded review images
      const reviewImages: { imageUrl: string }[] = [];
      if (req.files?.reviewImages) {
        const files = Array.isArray(req.files.reviewImages)
          ? req.files.reviewImages
          : [req.files.reviewImages];

        // Max 5 images
        const limitedFiles = files.slice(0, 5);

        for (const file of limitedFiles) {
          const uploadedUrl = await processImageUpload(file);
          if (uploadedUrl) {
            reviewImages.push({ imageUrl: uploadedUrl });
          }
        }
      }

      // Also support images from JSON body (FormData)
      if (reviewImages.length === 0 && images) {
        try {
          const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
          if (Array.isArray(parsedImages)) {
            reviewImages.push(
              ...parsedImages.slice(0, 5).map((url: string) => ({ imageUrl: url }))
            );
          }
        } catch (e) {
          console.error('Error parsing review images JSON:', e);
        }
      }

      const review = await productService.createReview(id, {
        name,
        rating: ratingNum,
        comment,
        pros,
        cons,
        images: reviewImages.length > 0 ? reviewImages : undefined,
      });
      */
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
  async createReviewFromBody(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await createReviewForProduct(req.body.productId, req);
      res.status(201).json(review);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      if (error.message?.includes('РЅРµ Р·РЅР°Р№РґРµРЅРѕ') || error.message?.includes('РўРѕРІР°СЂ')) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message?.includes('Р РµР№С‚РёРЅРі')
        || error.message?.includes('Р†Рј')
      ) {
        return res.status(400).json({ message: error.message });
      }
      if (typeof error.message === 'string') {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async getReviewsBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { sortBy, page, limit } = req.query as { sortBy?: ReviewSortOption; page?: string; limit?: string };

      const result = await productService.getBySlug(slug);

      const options: { sortBy?: ReviewSortOption; page?: number; limit?: number } = { sortBy };
      if (page) options.page = Number(page);
      if (limit) options.limit = Number(limit);

      const reviewsResult = await productService.getReviews(result.product.id, options);
      res.json(reviewsResult);
    } catch (error) {
      next(error);
    }
  }

  async createReviewBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { name, rating, comment, pros, cons, images } = req.body;

      // Validate rating
      const ratingNum = Number(rating);
      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Рейтинг має бути від 1 до 5' });
      }

      // Process uploaded review images
      const reviewImages: { imageUrl: string }[] = [];
      if (req.files?.reviewImages) {
        const files = Array.isArray(req.files.reviewImages)
          ? req.files.reviewImages
          : [req.files.reviewImages];

        // Max 5 images
        const limitedFiles = files.slice(0, 5);

        for (const file of limitedFiles) {
          const uploadedUrl = await processImageUpload(file);
          if (uploadedUrl) {
            reviewImages.push({ imageUrl: uploadedUrl });
          }
        }
      }

      // Also support images from JSON body (FormData)
      if (reviewImages.length === 0 && images) {
        try {
          const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
          if (Array.isArray(parsedImages)) {
            reviewImages.push(
              ...parsedImages.slice(0, 5).map((url: string) => ({ imageUrl: url }))
            );
          }
        } catch (e) {
          console.error('Error parsing review images JSON:', e);
        }
      }

      const productResult = await productService.getBySlug(slug);
      const review = await createReviewForProduct(productResult.product.id, req);
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

  // ===== REVIEW DELETE (Admin only — must be after admin auth middleware) =====

  /** DELETE /api/products/reviews/:reviewId — видалити відгук (admin) */
  async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      if (!reviewId || reviewId === 'undefined' || reviewId === 'null') {
        return res.status(400).json({ error: 'reviewId обов\'язковий' });
      }
      await productService.deleteReview(reviewId);
      res.json({ message: 'Відгук видалено' });
    } catch (error: any) {
      if (error.message.includes('не знайдено')) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  }

  async deleteSpecification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await productService.deleteSpecification(id);

      await adminService.logAction({
        adminId: req.user!.id,
        action: ActionType.DELETE,
        entity: 'ProductSpecification',
        entityId: id,
        details: `Deleted specification ${id}`,
        ipAddress: req.ip,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ===== VARIANT ROUTES (Public) =====

  /** GET /api/products/:productId/variants — отримати options + variants */
  async getVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
        return res.status(400).json({ error: 'Невірний формат productId' });
      }

      const [options, variants] = await Promise.all([
        variantService.getOptions(productId),
        variantService.getVariants(productId),
      ]);
      res.json({ options, variants });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/products/:productId/variants/find — знайти варіант за optionValueIds */
  async findVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { optionValueIds } = req.body; // string[]

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
        return res.status(400).json({ error: 'Невірний формат productId' });
      }

      if (!optionValueIds || !Array.isArray(optionValueIds) || optionValueIds.length === 0) {
        return res.status(400).json({ error: 'optionValueIds — обов\'язковий масив ID' });
      }

      const variant = await variantService.findVariantByOptions(productId, optionValueIds);
      res.json({ variant });
    } catch (error) {
      next(error);
    }
  }

  // ===== VARIANT ROUTES (Admin) =====

  /** POST /api/products/:productId/options — створити опцію */
  async createOption(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { name } = req.body;

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
        return res.status(400).json({ error: 'Невірний формат productId' });
      }
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "name — обов'язкове рядкове значення" });
      }

      const option = await variantService.createOption(productId, name.trim());
      res.status(201).json(option);
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/products/options/:optionId */
  async updateOption(req: Request, res: Response, next: NextFunction) {
    try {
      const { optionId } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "name — обов'язкове рядкове значення" });
      }

      const option = await variantService.updateOption(optionId, name.trim());
      res.json(option);
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/products/options/:optionId */
  async deleteOption(req: Request, res: Response, next: NextFunction) {
    try {
      const { optionId } = req.params;
      await variantService.deleteOption(optionId);
      res.json({ message: 'Опцію видалено' });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/products/options/:optionId/values — створити значення */
  async createOptionValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { optionId } = req.params;
      const { value } = req.body;

      if (!value || typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({ error: "value — обов'язкове рядкове значення" });
      }

      const optionValue = await variantService.createOptionValue(optionId, value.trim());
      res.status(201).json(optionValue);
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/products/option-values/:valueId */
  async deleteOptionValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { valueId } = req.params;
      await variantService.deleteOptionValue(valueId);
      res.json({ message: 'Значення видалено' });
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/products/:productId/variants — створити варіант */
  async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { price, stock, image, options } = req.body;

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
        return res.status(400).json({ error: 'Невірний формат productId' });
      }

      if (price === undefined || stock === undefined || !options) {
        return res.status(400).json({ error: 'price, stock, options — обов\'язкові' });
      }

      if (!Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ error: 'options — обов\'язковий масив [{ optionId, optionValueId, name, value }]' });
      }

      // Validate each option entry
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt.optionId || !opt.optionValueId || !opt.name || !opt.value) {
          return res.status(400).json({
            error: `option[${i}] повинен мати { optionId, optionValueId, name, value }`,
          });
        }
      }

      const variant = await variantService.createVariant({
        productId,
        price: Number(price),
        stock: Number(stock),
        image: image || null,
        options,
      });
      res.status(201).json(variant);
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/products/variants/:variantId — оновити варіант */
  async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.params;
      const data = req.body;

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variantId)) {
        return res.status(400).json({ error: 'Невірний формат variantId' });
      }

      const variant = await variantService.updateVariant(variantId, data);
      res.json(variant);
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/products/variants/:variantId — видалити варіант */
  async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.params;
      await variantService.deleteVariant(variantId);
      res.json({ message: 'Варіант видалено' });
    } catch (error) {
      next(error);
    }
  }
}
