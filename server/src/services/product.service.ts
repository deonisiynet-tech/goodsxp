import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { productSchema, productUpdateSchema, paginationSchema } from '../utils/validators.js';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class ProductService {
  async getAll(filters: ProductFilters) {
    const validated = paginationSchema.parse(filters);
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', category, minPrice, maxPrice } = validated;

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { categoryId: category }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
    };

    const orderBy: any = {};
    if (sortBy === 'popularity') {
      // Sort by review count and average rating
      orderBy.reviews = { _count: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          imageUrl: true,
          images: true,
          stock: true,
          isActive: true,
          createdAt: true,
          categoryId: true,
          _count: {
            select: { reviews: true }
          },
          reviews: {
            select: { rating: true },
            take: 100
          }
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map(product => {
      const reviews = product.reviews as any[];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      const { reviews: _, ...rest } = product as any;
      return {
        ...rest,
        averageRating: parseFloat(avgRating.toFixed(2)),
        reviewCount: reviews.length
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

  async search(query: string, limit: number = 20) {
    const where = {
      isActive: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const products = await prisma.product.findMany({
      where,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        images: true,
        stock: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { products };
  }

  async getSimilar(productId: string, limit: number = 4) {
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    if (!currentProduct) {
      throw new AppError('Товар не знайдено', 404);
    }

    const where: any = {
      id: { not: productId },
      isActive: true,
    };

    // If product has a category, find similar in same category
    if (currentProduct.categoryId) {
      where.categoryId = currentProduct.categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        images: true,
        stock: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { products };
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        images: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    return product;
  }

  async create(data: {
    title: string;
    description: string;
    price: number;
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

    const product = await prisma.product.update({
      where: { id },
      data: validated,
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
}
