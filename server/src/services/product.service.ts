import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { productSchema, productUpdateSchema, paginationSchema } from '../utils/validators.js';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
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
        },
      }),
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

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Calculate average rating
    const averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    const reviewCount = product.reviews.length;

    // Remove reviews from returned object
    const { reviews, ...productWithoutReviews } = product;

    return {
      ...productWithoutReviews,
      averageRating,
      reviewCount,
    };
  }

  async create(data: {
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
  }) {
    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId ?? null,
        rating: data.rating ?? null,
        originalPrice: data.originalPrice ?? null,
        discountPrice: data.discountPrice ?? null,
        isFeatured: data.isFeatured ?? false,
        isPopular: data.isPopular ?? false,
        imageUrl: data.imageUrl ?? null,
        images: data.images ?? [],
        stock: data.stock ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return product;
  }

  async update(id: string, data: Partial<typeof productSchema._type>) {
    const validated = productUpdateSchema.parse(data);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Only include fields that exist in the Prisma schema
    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.price !== undefined) updateData.price = validated.price;
    if (validated.categoryId !== undefined) updateData.categoryId = validated.categoryId;
    if (validated.rating !== undefined) updateData.rating = validated.rating;
    if (validated.originalPrice !== undefined) updateData.originalPrice = validated.originalPrice;
    if (validated.discountPrice !== undefined) updateData.discountPrice = validated.discountPrice;
    if (validated.isFeatured !== undefined) updateData.isFeatured = validated.isFeatured;
    if (validated.isPopular !== undefined) updateData.isPopular = validated.isPopular;
    if (validated.imageUrl !== undefined) updateData.imageUrl = validated.imageUrl;
    if (validated.images !== undefined) updateData.images = validated.images;
    if (validated.stock !== undefined) updateData.stock = validated.stock;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return product;
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
      }),
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

  async getReviews(productId: string) {
    return prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReview(productId: string, data: { name: string; rating: number; comment?: string }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error('Товар не знайдено');
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

    // Update the product rating
    await prisma.product.update({
      where: { id: productId },
      data: { rating: stats._avg.rating ? Math.round(stats._avg.rating * 100) / 100 : 0 },
    });

    return review;
  }
}
