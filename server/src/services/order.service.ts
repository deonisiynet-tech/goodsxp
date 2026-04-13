import prisma from '../prisma/client.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { orderSchema, orderStatusSchema } from '../utils/validators.js';
import { notifyNewOrder, notifyOrderStatusChanged } from './telegram.service.js';
import { formatOrderNumber } from '../utils/order-formatter.js';

interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  email?: string;
}

export class OrderService {
  async create(data: {
    userId?: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    warehouse?: string | null;
    warehouseAddress?: string | null;
    comment?: string;
    paymentMethod?: 'COD' | 'CARD';
    items: { productId: string; quantity: number; variantId?: string | null; variantOptions?: Array<{ name: string; value: string }> | null }[];
  }) {
    const validated = orderSchema.parse(data);

    // Перевіряємо що кошик не порожній
    if (!validated.items || validated.items.length === 0) {
      throw new AppError('Кошик порожній', 400);
    }

    // 🔒 SECURITY: Ціни завантажуються ВИКЛЮЧНО з БД, ігнорується будь-яка ціна з frontend.
    // SELECT ... FOR_UPDATE блокує рядки на рівні БД для запобігання race conditions.
    const order = await prisma.$transaction(async (tx) => {
      // ✅ SELECT ... FOR UPDATE — блокуємо рядки продуктів на рівні БД
      // Запобігає race condition: інша транзакція чекатиме поки ця завершиться
      const productIds = validated.items.map((item) => item.productId);
      const products = await tx.$queryRaw<Array<{
        id: string;
        title: string;
        price: import('@prisma/client').Prisma.Decimal;
        discountPrice: import('@prisma/client').Prisma.Decimal | null;
        margin: number;
        stock: number;
        isActive: boolean;
      }>>`
        SELECT id, title, price, "discountPrice", margin, stock, "isActive"
        FROM "Product"
        WHERE id IN (${productIds.join(',')}) AND "isActive" = true
        FOR UPDATE
      `;

      if (products.length !== validated.items.length) {
        throw new AppError('Деякі товари недоступні', 400);
      }

      // ✅ Check stock: якщо є variantId — перевіряємо variant.stock, інакше product.stock
      for (const item of validated.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new AppError('Товар недоступний', 400);
        }

        if (item.variantId) {
          // 🔒 FOR UPDATE — блокуємо рядок варіанту на рівні БД
          // Запобігає race condition при одночасному замовленні одного варіанту
          const variant = await tx.$queryRaw<Array<{
            id: string;
            stock: number;
            "productId": string;
          }>>`
            SELECT id, stock, "productId"
            FROM "ProductVariant"
            WHERE id = ${item.variantId}
            FOR UPDATE
          `;

          if (variant.length === 0) {
            throw new AppError('Обраний варіант товару недоступний', 400);
          }

          const v = variant[0];

          // 🔒 SECURITY: Verify variant belongs to the specified product.
          if (v.productId !== item.productId) {
            throw new AppError('Варіант не відповідає товару', 400);
          }

          if (v.stock < item.quantity) {
            throw new AppError(
              `Товар "${product.title}" (варіант) недоступний у кількості ${item.quantity}. Доступно: ${v.stock}`,
              400
            );
          }
        } else {
          // Перевіряємо базовий stock товару
          if (product.stock < item.quantity) {
            throw new AppError(
              `Товар "${product.title}" недоступний у кількості ${item.quantity}. Доступно: ${product.stock}`,
              400
            );
          }
        }
      }

      // Calculate total price and total profit + precompute prices for items
      let totalPrice = 0;
      let totalProfit = 0;
      const itemPrices: Map<string, number> = new Map(); // productId -> effectivePrice

      for (const item of validated.items) {
        const product = products.find((p) => p.id === item.productId)!;
        let effectivePrice: number;

        // Якщо є variant — використовуємо ціну варіанту
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { price: true },
          });
          effectivePrice = variant ? Number(variant.price) : Number(product.price);
        } else {
          const priceNum = Number(product.price);
          const discountNum = product.discountPrice ? Number(product.discountPrice) : null;
          effectivePrice = (discountNum !== null && discountNum < priceNum) ? discountNum : priceNum;
        }

        itemPrices.set(`${item.productId}-${item.variantId || 'default'}`, effectivePrice);
        totalPrice += effectivePrice * item.quantity;
        totalProfit += Number(product.margin ?? 0) * item.quantity;
      }

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: data.userId || null,
          name: validated.name,
          phone: validated.phone,
          email: validated.email,
          address: validated.address,
          city: validated.city,
          warehouse: validated.warehouse,
          warehouseAddress: validated.warehouseAddress,
          comment: validated.comment,
          paymentMethod: validated.paymentMethod || 'COD',
          totalPrice,
          items: {
            create: validated.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              const effectivePrice = itemPrices.get(`${item.productId}-${item.variantId || 'default'}`)!;

              return {
                productId: item.productId,
                variantId: item.variantId || null,
                variantOptions: item.variantOptions ? (item.variantOptions as any) : null,
                quantity: item.quantity,
                price: effectivePrice,
                margin: product.margin ?? 0,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Update stock — атомарний decrement всередині транзакції
      for (const item of validated.items) {
        if (item.variantId) {
          // Зменшуємо stock конкретного варіанту
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          // Зменшуємо базовий stock товару
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    }, {
      // ✅ Таймаут транзакції — 10 секунд (швидше фейлить ніж блокує)
      timeout: 10000,
      // ✅ Isolation level — гарантує що SELECT ... FOR UPDATE блокує рядки
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // Відправляємо повідомлення в Telegram (не блокуюче)
    // Помилка Telegram не впливає на створення замовлення
    notifyNewOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
      totalPrice: order.totalPrice,
      name: order.name,
      phone: order.phone,
      email: order.email,
      city: order.city,
      warehouse: order.warehouse,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt,
    }).catch((error) => {
      console.error('❌ Failed to send Telegram notification:', error);
    });

    return order;
  }

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Замовлення не знайдено', 404);
    }

    return order;
  }

  /** Отримати замовлення конкретного користувача (IDOR-safe) */
  async getMyOrders(userId: string, filters: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      userId, // ✅ Тільки замовлення цього користувача
      deletedAt: null,
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          name: true,
          phone: true,
          email: true,
          totalPrice: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAll(filters: OrderFilters) {
    const { page = 1, limit = 20, status, email } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Виключаємо м'яко видалені
    };
    if (status) where.status = status;
    if (email) where.email = { contains: email, mode: 'insensitive' };

    // Light projection — не тягнемо повні дані продукту для кожного item
    // Тільки основна інформація для списку
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Валідні переходи статусів замовлення
   * Запобігає нелогічним переходам (наприклад DELIVERED → NEW)
   */
  private readonly VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
    NEW: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [], // Термінальний статус
    CANCELLED: [], // Термінальний статус
  };

  async updateStatus(id: string, status: string) {
    const validated = orderStatusSchema.parse({ status });

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Замовлення не знайдено', 404);
    }

    const oldStatus = existing.status;
    const newStatus = validated.status;

    // Перевірка валідності переходу статусу
    const allowedTransitions = this.VALID_STATUS_TRANSITIONS[oldStatus];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new AppError(
        `Недійсний перехід статусу: ${oldStatus} → ${newStatus}. Дозволені: ${allowedTransitions?.join(', ') || 'немає'}`,
        400
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: validated.status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // Відправляємо повідомлення про зміну статусу (не блокуюче)
    if (oldStatus !== validated.status) {
      notifyOrderStatusChanged(
        {
          id: order.id,
          orderNumber: order.orderNumber,
          items: order.items,
          totalPrice: order.totalPrice,
          name: order.name,
          phone: order.phone,
          email: order.email,
          city: order.city,
          warehouse: order.warehouse,
          status: order.status,
          createdAt: order.createdAt,
        },
        oldStatus,
        validated.status
      ).catch((error) => {
        console.error('❌ Failed to send Telegram status notification:', error);
      });
    }

    return order;
  }

  async delete(id: string) {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError('Замовлення не знайдено', 404);
    }

    // Забороняємо видаляти замовлення зі статусами DELIVERED/SHIPPED без попередження
    if (existing.status === 'DELIVERED' || existing.status === 'SHIPPED') {
      throw new AppError(
        `Неможливо видалити замовлення зі статусом "${existing.status}". Спочатку змініть статус на CANCELLED.`,
        400
      );
    }

    // Soft delete — встановлюємо deletedAt замість фізичного видалення
    // Для NEW/PROCESSING/CANCELLED — повертаємо товар на склад
    if (existing.status === 'NEW' || existing.status === 'PROCESSING' || existing.status === 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          // ✅ Перевіряємо що продукт існує перед increment stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true },
          });

          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
        // Soft delete
        await tx.order.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      });
    } else {
      // Soft delete для інших статусів
      await prisma.order.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }

    return { message: 'Замовлення видалено' };
  }

  async getStats() {
    const stats = await prisma.$transaction([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'NEW' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      total: stats[0],
      new: stats[1],
      processing: stats[2],
      shipped: stats[3],
      delivered: stats[4],
      revenue: Number(stats[5]._sum.totalPrice || 0),
    };
  }

  /**
   * Розрахунок прибутку через OrderItem.margin × quantity
   */
  async getProfitStats() {
    // Загальний прибуток: SUM(margin * quantity) по всім OrderItem
    const profitResult = await prisma.orderItem.aggregate({
      _sum: {
        margin: true,
        quantity: true,
      },
    });

    // Прибуток не можна просто рахувати як margin * quantity aggregate,
    // треба рахувати для кожного item margin * quantity, потім SUM
    // Простіше: сума всіх (margin × quantity) через raw SQL
    const profitRaw = await prisma.$queryRaw`
      SELECT SUM("margin"::FLOAT * "quantity"::FLOAT) as "totalProfit"
      FROM "OrderItem"
    `;

    const totalProfit = (profitRaw as any[])?.[0]?.totalProfit || 0;

    return {
      totalProfit: Number(totalProfit),
    };
  }
}
