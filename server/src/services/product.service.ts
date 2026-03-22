import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { productSchema, productUpdateSchema, paginationSchema } from '../utils/validators.js';
import { Prisma } from '@prisma/client';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface ProductCreateInput {
  title: string;
  description: string;
  price: number;
  categoryId?: string | null;
  rating?: number | null;
  originalPrice?: number | null;
  discountPrice?: number | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  imageUrl?: string | null;
  images?: string[];
  stock?: number;
  isActive?: boolean;
}

interface ProductUpdateInput {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: string | null;
  rating?: number | null;
  originalPrice?: number | null;
  discountPrice?: number | null;
  isFeatured?: boolean;
  isPopular?: boolean;
  imageUrl?: string | null;
  images?: string[];
  stock?: number;
  isActive?: boolean;
}

interface ReviewSortOptions {
  sortBy?: 'newest' | 'best' | 'worst';
}

export class ProductService {
  async getAll(filters: ProductFilters) {
    const validated = paginationSchema.parse(filters);
    const { page, limit, search, sortBy, sortOrder } = validated;

    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }) as Promise<any[]>,
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map((product: any) => {
      const { reviews, ...rest } = product;
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
          : 0;
      return {
        ...rest,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });

    return {
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    }) as any;

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Calculate average rating
    const averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / product.reviews.length
        : 0;

    const reviewCount = product.reviews.length;

    // Remove reviews from returned object
    const { reviews, ...productWithoutReviews } = product;

    return {
      ...productWithoutReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount,
    };
  }

  async getBySlug(slug: string) {
    // Use raw query since slug field may not exist in Prisma Client yet
    const products = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Product" WHERE slug = $1 LIMIT 1`,
      slug
    ) as any[];

    if (!products || products.length === 0) {
      throw new AppError('Товар не знайдено', 404);
    }

    const productData = products[0];

    // Get reviews
    const reviews = await prisma.review.findMany({
      where: { productId: productData.id },
      select: { rating: true },
    });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      ...productData,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
    };
  }

  async create(data: ProductCreateInput) {
    // Generate slug from title
    let slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04FF-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists and add random suffix
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM "Product" WHERE slug = $1 LIMIT 1`,
      slug
    ) as any[];
    
    if (existing && existing.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Convert images array to PostgreSQL array format
    const imagesArray = data.images ?? [];
    const imagesPg = `{${imagesArray.map(img => `"${img.replace(/"/g, '\\"')}"`).join(',')}}`;

    // Create product using raw query to include slug
    const result = await prisma.$queryRawUnsafe(
      `INSERT INTO "Product" (id, title, slug, description, price, "categoryId", rating, "originalPrice", "discountPrice", "isFeatured", "isPopular", "imageUrl", images, stock, "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      data.title,
      slug,
      data.description,
      data.price,
      data.categoryId,
      data.rating ?? null,
      data.originalPrice ?? null,
      data.discountPrice ?? null,
      data.isFeatured ?? false,
      data.isPopular ?? false,
      data.imageUrl ?? null,
      imagesPg,
      data.stock ?? 0,
      data.isActive ?? true
    ) as any[];

    return result[0];
  }

  async update(id: string, data: ProductUpdateInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Build update fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      const newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      updateFields.push(`title = $${paramIndex++}, slug = $${paramIndex++}`);
      values.push(data.title, newSlug);
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    if (data.categoryId !== undefined) {
      updateFields.push(`"categoryId" = $${paramIndex++}`);
      values.push(data.categoryId);
    }
    if (data.rating !== undefined) {
      updateFields.push(`rating = $${paramIndex++}`);
      values.push(data.rating);
    }
    if (data.originalPrice !== undefined) {
      updateFields.push(`"originalPrice" = $${paramIndex++}`);
      values.push(data.originalPrice);
    }
    if (data.discountPrice !== undefined) {
      updateFields.push(`"discountPrice" = $${paramIndex++}`);
      values.push(data.discountPrice);
    }
    if (data.isFeatured !== undefined) {
      updateFields.push(`"isFeatured" = $${paramIndex++}`);
      values.push(data.isFeatured);
    }
    if (data.isPopular !== undefined) {
      updateFields.push(`"isPopular" = $${paramIndex++}`);
      values.push(data.isPopular);
    }
    if (data.imageUrl !== undefined) {
      updateFields.push(`"imageUrl" = $${paramIndex++}`);
      values.push(data.imageUrl);
    }
    if (data.images !== undefined) {
      updateFields.push(`images = $${paramIndex++}`);
      // Convert JS array to PostgreSQL array format
      const imagesArray = Array.isArray(data.images) ? data.images : [];
      const imagesPg = `{${imagesArray.map(img => `"${img.replace(/"/g, '\\"')}"`).join(',')}}`;
      values.push(imagesPg);
    }
    if (data.stock !== undefined) {
      updateFields.push(`stock = $${paramIndex++}`);
      values.push(data.stock);
    }
    if (data.isActive !== undefined) {
      updateFields.push(`"isActive" = $${paramIndex++}`);
      values.push(data.isActive);
    }

    updateFields.push(`"updatedAt" = NOW()`);
    values.push(id);

    const result = await prisma.$queryRawUnsafe(
      `UPDATE "Product" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      ...values
    ) as any[];

    return result[0];
  }

  async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    await prisma.product.delete({ where: { id } });
    return { message: 'Товар видалено' };
  }

  async getAllAdmin(filters: ProductFilters) {
    const validated = paginationSchema.parse(filters);
    const { page, limit, search, sortBy, sortOrder } = validated;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          categoryId: true,
          rating: true,
          originalPrice: true,
          discountPrice: true,
          isFeatured: true,
          isPopular: true,
          imageUrl: true,
          images: true,
          stock: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }) as Promise<any[]>,
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviews(productId: string, options: ReviewSortOptions = {}) {
    const { sortBy = 'newest' } = options;

    let orderBy: Prisma.ReviewOrderByWithRelationInput;

    switch (sortBy) {
      case 'best':
        orderBy = { rating: 'desc' };
        break;
      case 'worst':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    return prisma.review.findMany({
      where: { productId },
      orderBy,
    });
  }

  async createReview(productId: string, data: { name: string; rating: number; comment?: string }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error('Товар не знайдено');
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Рейтинг має бути від 1 до 5');
    }

    const review = await prisma.review.create({
      data: {
        productId,
        name: data.name,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Update product average rating
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Update the product rating with proper null handling
    const avgRating = stats._avg.rating ?? 0;
    await prisma.product.update({
      where: { id: productId },
      data: { rating: Math.round(avgRating * 100) / 100 },
    });

    return review;
  }
}
