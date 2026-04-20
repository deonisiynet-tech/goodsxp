import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { productSchema, productUpdateSchema, paginationSchema, sanitizeHtmlText } from '../utils/validators.js';
import { Prisma } from '@prisma/client';
import { CacheService } from './cache.service.js';

/**
 * Обчислює відсоток знижки
 * discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100
 * Повертає null якщо знижки немає
 */
function calculateDiscountPercent(
  originalPrice: number | null | undefined,
  discountPrice: number | null | undefined
): number | null {
  if (!originalPrice || !discountPrice || originalPrice <= 0 || discountPrice >= originalPrice) {
    return null;
  }
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
}

/**
 * Додає discountPercent до продукту
 */
function withDiscountPercent(product: any): any {
  const discountPercent = calculateDiscountPercent(
    product.originalPrice,
    product.discountPrice
  );
  return {
    ...product,
    discountPercent,
  };
}

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  featured?: string;
  popular?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductCreateInput {
  title: string;
  description: string;
  price: number;
  margin?: number;
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
  margin?: number;
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

interface ReviewPaginationOptions {
  sortBy?: 'newest' | 'best' | 'worst';
  page?: number;
  limit?: number;
}

interface ReviewImageInput {
  imageUrl: string;
}

interface ProductSpecificationInput {
  id?: string;
  key: string;
  value: string;
}

export class ProductService {
  async getAllCategories() {
    // Перевіряємо кеш
    const cached = await CacheService.getCategories();
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Кешуємо результат
    await CacheService.cacheCategories(categories);
    return categories;
  }

  async getByCategory(categoryId: string, limit: number = 4, excludeId?: string) {
    // 🔒 SECURITY: Explicit select — exclude `margin` from public API
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId,
        ...(excludeId && { id: { not: excludeId } }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        originalPrice: true,
        discountPrice: true,
        imageUrl: true,
        slug: true,
        stock: true,
        isFeatured: true,
        isPopular: true,
        rating: true,
      },
    });

    return products;
  }

  async getAll(filters: ProductFilters) {
    const validated = paginationSchema.parse(filters);
    const { page, limit, search, sortBy, sortOrder } = validated;

    // Генеруємо ключ кешу
    const cacheKey = `products:${JSON.stringify({ page, limit, search, sortBy, sortOrder, featured: filters.featured, popular: filters.popular, category: filters.category, minPrice: filters.minPrice, maxPrice: filters.maxPrice })}`;

    // Перевіряємо кеш (тільки якщо немає пошуку - пошук не кешуємо)
    if (!search) {
      const cached = await CacheService.get(cacheKey);
      if (cached) return cached;
    }

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filters.featured && { isFeatured: true }),
      ...(filters.popular && { isPopular: true }),
      ...(!filters.featured && !filters.popular && filters.category && { categoryId: filters.category }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
    };

    // 🔒 SECURITY: Explicit select — exclude `margin` (business secret) from public API
    const products = await prisma.product.findMany({
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
        slug: true,
        variants: {
          select: {
            id: true,
            price: true,
            stock: true,
            image: true,
            options: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: { variants: true, reviews: true },
        },
      },
    }) as any[];

    const total = await prisma.product.count({ where });

    // Обчислюємо середній рейтинг через aggregate — без завантаження всіх відгуків
    const productIds = products.map(p => p.id);
    const ratingStats = await prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingMap = new Map(ratingStats.map(s => [s.productId, { avg: s._avg.rating ?? 0, count: s._count.rating }]));

    const productsWithRating = products.map((product: any) => {
      const stats = ratingMap.get(product.id);
      const hasVariants = product._count?.variants > 0;
      return {
        ...product,
        averageRating: stats ? Math.round((stats.avg as number) * 10) / 10 : 0,
        reviewCount: stats ? (stats.count as number) : 0,
        hasVariants,
      };
    });

    const result = {
      products: productsWithRating.map(withDiscountPercent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Кешуємо результат (тільки якщо немає пошуку)
    if (!search) {
      await CacheService.cacheProducts(cacheKey, result);
    }

    return result;
  }

  async getById(id: string) {
    // 🔒 SECURITY: Explicit select — exclude `margin` (business secret) from public API
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
        slug: true,
        variants: {
          select: {
            id: true,
            price: true,
            stock: true,
            image: true,
            options: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            name: true,
            rating: true,
            comment: true,
            pros: true,
            cons: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { variants: true },
        },
      },
    }) as any;

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Обчислюємо середній рейтинг через aggregate
    const stats = await prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
    const reviewCount = stats._count.rating;

    return {
      ...product,
      averageRating,
      reviewCount,
      ...withDiscountPercent(product),
    };
  }

  // ✅ FIX: Admin version of getById that includes margin
  async getByIdAdmin(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        margin: true, // ✅ Include margin for admin
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
        slug: true,
        variants: {
          select: {
            id: true,
            price: true,
            stock: true,
            image: true,
            options: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            name: true,
            rating: true,
            comment: true,
            pros: true,
            cons: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { variants: true },
        },
      },
    }) as any;

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    // Обчислюємо середній рейтинг через aggregate
    const stats = await prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
    const reviewCount = stats._count.rating;

    return {
      ...product,
      averageRating,
      reviewCount,
      ...withDiscountPercent(product),
    };
  }

  async getBySlug(slug: string): Promise<{ product: any; redirectedFrom?: string }> {
    // 🔒 SECURITY: Explicit select — exclude `margin` (business secret) from public API
    const productSelect = {
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
      slug: true,
      variants: {
        select: {
          id: true,
          price: true,
          stock: true,
          image: true,
          options: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    };

    // Спочатку шукаємо по поточному slug
    let product = await prisma.product.findFirst({
      where: { slug },
      select: productSelect,
    }) as any;

    // ✅ Якщо не знайдено — шукаємо в редіректах
    if (!product) {
      try {
        const redirect = await prisma.productSlugRedirect.findUnique({
          where: { oldSlug: slug },
        });

        if (redirect) {
          // Знайшли редірект — отримуємо товар по новому slug
          product = await prisma.product.findFirst({
            where: { slug: redirect.newSlug },
            select: productSelect,
          }) as any;

          if (!product) {
            throw new AppError('Товар не знайдено', 404);
          }

          return {
            product: {
              ...product,
              ...withDiscountPercent(product),
              ...(await this.getProductRating(product.id)),
            },
            redirectedFrom: slug,
          };
        }
      } catch (err: any) {
        // Таблиця ProductSlugRedirect ще не існує — пропускаємо редіректи
        if (err.code === 'P2021' || err.code === 'P2022') {
          // continue — таблиці немає, просто шукаємо по slug
        } else {
          throw err;
        }
      }

      throw new AppError('Товар не знайдено', 404);
    }

    return {
      product: {
        ...product,
        ...withDiscountPercent(product),
        ...(await this.getProductRating(product.id)),
      },
    };
  }

  private async getProductRating(productId: string) {
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
      reviewCount: stats._count.rating,
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
    const existing = await prisma.product.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create product using Prisma Client
    const result = await prisma.product.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        margin: data.margin ?? 0,
        categoryId: data.categoryId,
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

    // Інвалідуємо кеш
    await CacheService.invalidateCatalog();

    return result;
  }

  async update(id: string, data: ProductUpdateInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
      // Генеруємо новий slug з перевіркою унікальності
      let newSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Перевіряємо чи slug вже зайнятий ІНШИМ товаром
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: newSlug,
          id: { not: id }, // Виключаємо поточний товар
        },
        select: { id: true },
      });

      if (slugConflict) {
        // Додаємо унікальний суфікс
        newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 8)}`;
      }

      // ⚠️ DISABLED: ProductSlugRedirect викликав deadlock при множинних update
      // Редіректи slug не критичні — можна додати пізніше через background job
      if (existing.slug !== newSlug) {
        updateData.slug = newSlug;
      }
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.margin !== undefined) updateData.margin = data.margin;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    try {
      const result = await prisma.product.update({
        where: { id },
        data: updateData,
      });

      // Інвалідуємо кеш
      await CacheService.invalidateProduct(id, existing.slug);

      return result;
    } catch (error: any) {
      console.error('❌ Product update failed:', {
        productId: id,
        error: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
      throw error;
    }
  }

  async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Товар не знайдено', 404);
    }

    await prisma.product.delete({ where: { id } });

    // Інвалідуємо кеш
    await CacheService.invalidateProduct(id, existing.slug);

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
          margin: true,
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
          slug: true,
        },
      }) as Promise<any[]>,
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map(withDiscountPercent),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSpecifications(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    return prisma.productSpecification.findMany({
      where: { productId },
      orderBy: { key: 'asc' },
    });
  }

  async saveSpecification(productId: string, data: ProductSpecificationInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    const sanitizedKey = sanitizeHtmlText((data.key || '').trim()).slice(0, 120);
    const sanitizedValue = sanitizeHtmlText((data.value || '').trim()).slice(0, 500);

    if (!sanitizedKey) {
      throw new AppError('Назва характеристики обов’язкова', 400);
    }

    if (!sanitizedValue) {
      throw new AppError('Значення характеристики обов’язкове', 400);
    }

    if (data.id) {
      const existing = await prisma.productSpecification.findUnique({
        where: { id: data.id },
      });

      if (!existing || existing.productId !== productId) {
        throw new AppError('Характеристику не знайдено', 404);
      }

      return prisma.productSpecification.update({
        where: { id: data.id },
        data: {
          key: sanitizedKey,
          value: sanitizedValue,
        },
      });
    }

    return prisma.productSpecification.create({
      data: {
        productId,
        key: sanitizedKey,
        value: sanitizedValue,
      },
    });
  }

  async deleteSpecification(specificationId: string) {
    const existing = await prisma.productSpecification.findUnique({
      where: { id: specificationId },
    });

    if (!existing) {
      throw new AppError('Характеристику не знайдено', 404);
    }

    await prisma.productSpecification.delete({
      where: { id: specificationId },
    });

    return { message: 'Характеристику видалено' };
  }

  async getReviews(productId: string, options: ReviewPaginationOptions = {}) {
    const { sortBy = 'newest', page, limit } = options;

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

    // Helper: fetch reviews with or without images (fallback if ReviewImage table doesn't exist yet)
    const fetchReviewsWithImages = async (findManyArgs: any) => {
      try {
        // Try with images
        return await prisma.review.findMany({
          ...findManyArgs,
          include: {
            images: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      } catch (err: any) {
        // P2021/P2022 = table doesn't exist yet — fallback to reviews without images
        if (err.code === 'P2021' || err.code === 'P2022' || err.code === 'P1001') {
          return prisma.review.findMany(findManyArgs);
        }
        throw err;
      }
    };

    // If pagination is requested
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [reviews, total] = await Promise.all([
        fetchReviewsWithImages({
          where: { productId },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.review.count({ where: { productId } }),
      ]);

      return { reviews, total };
    }

    // No pagination — return all (backward compatibility)
    const reviews = await fetchReviewsWithImages({
      where: { productId },
      orderBy,
    });

    const total = reviews.length;
    return { reviews, total };
  }

  async createReview(productId: string, data: { name: string; rating: number; comment?: string; pros?: string; cons?: string; images?: ReviewImageInput[] }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new Error('Товар не знайдено');
    }

    // ✅ Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Рейтинг має бути від 1 до 5');
    }

    // ✅ Validate and sanitize name — XSS protection
    if (!data.name || typeof data.name !== 'string') {
      throw new Error("Ім'я обов'язкове");
    }
    const sanitizedName = sanitizeHtmlText(data.name.trim()).slice(0, 100);
    if (sanitizedName.length < 1) {
      throw new Error("Ім'я занадто коротке");
    }

    // ✅ Validate and sanitize comment — XSS protection
    let sanitizedComment: string | undefined = undefined;
    if (data.comment) {
      sanitizedComment = sanitizeHtmlText(data.comment.trim()).slice(0, 2000);
    }

    // ✅ Validate and sanitize pros/cons — XSS protection
    let sanitizedPros: string | undefined = undefined;
    if (data.pros) {
      sanitizedPros = sanitizeHtmlText(data.pros.trim()).slice(0, 1000) || undefined;
    }
    let sanitizedCons: string | undefined = undefined;
    if (data.cons) {
      sanitizedCons = sanitizeHtmlText(data.cons.trim()).slice(0, 1000) || undefined;
    }

    const createData: any = {
      productId,
      name: sanitizedName,
      rating: data.rating,
      comment: sanitizedComment,
      pros: sanitizedPros,
      cons: sanitizedCons,
    };

    if (data.images && data.images.length > 0) {
      createData.images = {
        create: data.images.map((img) => ({
          imageUrl: img.imageUrl,
        })),
      };
    }

    let review: any;
    try {
      review = await prisma.review.create({
        data: createData,
        include: {
          images: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (err: any) {
      // Table doesn't exist — fallback without images
      if (err.code === 'P2021' || err.code === 'P2022') {
        review = await prisma.review.create({
          data: createData,
        });
        // Attach empty images array for consistency
        review.images = [];
      } else {
        throw err;
      }
    }

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

  async deleteReview(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError('Відгук не знайдено', 404);

    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate product rating
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating = stats._avg.rating ?? 0;
    await prisma.product.update({
      where: { id: review.productId },
      data: { rating: Math.round(avgRating * 100) / 100 },
    });

    return { message: 'Відгук видалено' };
  }
}
