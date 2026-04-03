import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { ActionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

interface StatsFilters {
  days?: number;
}

export class AdminService {
  // ==================== USERS ====================
  async getAllUsers(filters: UserFilters) {
    const { page = 1, limit = 20, role, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          orders: {
            select: {
              id: true,
              totalPrice: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        logs: {
          select: {
            action: true,
            entity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new AppError('Користувача не знайдено', 404);
    }

    return user;
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Користувача не знайдено', 404);
    }

    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async resetUserPassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async deleteUser(id: string) {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!existing) {
      throw new AppError('Користувача не знайдено', 404);
    }

    // Не видаляємо користувачів з замовленнями
    if (existing.orders.length > 0) {
      throw new AppError(
        'Неможливо видалити користувача з замовленнями',
        400
      );
    }

    return prisma.user.delete({ where: { id } });
  }

  // ==================== STATS ====================
  async getDashboardStats(filters?: StatsFilters) {
    const days = filters?.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Today's start and end
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
      const [
        totalUsers,
        totalOrders,
        totalRevenue,
        totalProducts,
        ordersToday,
        newOrdersCount,
        processingOrdersCount,
        deliveredOrdersCount,
        ordersByStatus,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalPrice: true },
        }),
        prisma.product.count(),
        prisma.order.count({
          where: {
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        }),
        prisma.order.count({ where: { status: 'NEW' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

      // Raw SQL queries отдельно (могут падать из-за SQL синтаксиса)
      let dailyRevenue: any[] = [];
      let dailyOrders: any[] = [];
      try {
        dailyRevenue = await prisma.$queryRaw`
          SELECT DATE("createdAt") as date, SUM("totalPrice") as revenue
          FROM "Order"
          WHERE "createdAt" >= ${startDate}
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
          LIMIT ${days}
        `;
      } catch (e) {
        console.error('❌ dailyRevenue query failed:', e);
      }

      try {
        dailyOrders = await prisma.$queryRaw`
          SELECT DATE("createdAt") as date, COUNT(*) as orders
          FROM "Order"
          WHERE "createdAt" >= ${startDate}
          GROUP BY DATE("createdAt")
          ORDER BY date DESC
          LIMIT ${days}
        `;
      } catch (e) {
        console.error('❌ dailyOrders query failed:', e);
      }

      // Top products
      let topProducts: any[] = [];
      let topProductsWithDetails: any[] = [];
      try {
        topProducts = await prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          _count: true,
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        });

        const topProductIds = topProducts.map((p: any) => p.productId);
        const topProductsDetails = await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, title: true, price: true, imageUrl: true },
        });

        topProductsWithDetails = topProducts.map((tp: any) => ({
          ...tp,
          product: topProductsDetails.find((p: any) => p.id === tp.productId),
        }));
      } catch (e) {
        console.error('❌ topProducts query failed:', e);
      }

      // Recent orders
      let recentOrders: any[] = [];
      try {
        recentOrders = await prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
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
      } catch (e) {
        console.error('❌ recentOrders query failed:', e);
      }

      return {
        totalUsers,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
        totalProducts,
        ordersToday,
        new: newOrdersCount,
        processing: processingOrdersCount,
        delivered: deliveredOrdersCount,
        ordersByStatus: ordersByStatus.map((s: any) => ({
          status: s.status,
          count: s._count,
        })),
        dailyRevenue,
        dailyOrders,
        topProducts: topProductsWithDetails,
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          name: order.name,
          email: order.email,
          totalPrice: Number(order.totalPrice),
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item: any) => ({
            quantity: item.quantity,
            product: {
              title: item.product?.title || 'Удалённый товар',
              imageUrl: item.product?.imageUrl || null,
            },
          })),
        })),
      };
    } catch (error: any) {
      console.error('❌ getDashboardStats error:', error.message);
      throw error;
    }
  }

  // ==================== SALES STATS ====================
  async getSalesStats(filters?: StatsFilters) {
    const days = filters?.days || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyRevenue = await prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        SUM("totalPrice") as revenue
      FROM "Order"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT ${days}
    `;

    return {
      dailyRevenue,
    };
  }

  // ==================== TOP PRODUCTS ====================
  async getTopProducts(filters?: { limit?: number }) {
    const limit = filters?.limit || 5;

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    // Get information about top products
    const topProductIds = topProducts.map((p: { productId: string }) => p.productId);
    const topProductsDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, title: true, price: true, imageUrl: true },
    });

    const topProductsWithDetails = topProducts.map((tp: { productId: string; _sum: { quantity: number | null }; _count: number }) => ({
      ...tp,
      product: topProductsDetails.find((p: { id: string }) => p.id === tp.productId),
    }));

    return topProductsWithDetails;
  }

  // ==================== ADMIN LOGS ====================
  async getAdminLogs(filters: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
  }) {
    const { page = 1, limit = 50, adminId, action } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async logAction(data: {
    adminId: string;
    action: ActionType;
    entity?: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await prisma.adminLog.create({
        data: {
          adminId: data.adminId,
          action: data.action,
          entity: data.entity || null,
          entityId: data.entityId || null,
          details: data.details || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (error: any) {
      console.error('❌ Failed to create AdminLog:', error.message);
      return null;
    }
  }

  // ==================== SITE SETTINGS ====================
  async getSettings() {
    const settings = await prisma.siteSettings.findMany({
      orderBy: { key: 'asc' },
    });

    const settingsObject: Record<string, any> = {};
    settings.forEach((s) => {
      if (s.type === 'json') {
        settingsObject[s.key] = JSON.parse(s.value);
      } else if (s.type === 'boolean') {
        settingsObject[s.key] = s.value === 'true';
      } else if (s.type === 'number') {
        settingsObject[s.key] = Number(s.value);
      } else {
        settingsObject[s.key] = s.value;
      }
    });

    return settingsObject;
  }

  /**
   * Оновлення налаштування з валідацією
   */
  async updateSetting(key: string, value: string | undefined | null, description?: string) {
    // ✅ ВАЛІДАЦІЯ: key обов'язковий
    if (!key) {
      throw new AppError('Ключ налаштування обов\'язковий', 400);
    }

    // ✅ ВАЛІДАЦІЯ: value не може бути undefined/null
    if (value === undefined || value === null) {
      throw new AppError('Значення налаштування обов\'язкове', 400);
    }

    // ✅ ВИЗНАЧАЄМО ТИП ЗА КЛЮЧЕМ
    let settingType = 'text';
    if (key.includes('json')) {
      settingType = 'json';
    } else if (key === 'storeEnabled') {
      settingType = 'boolean';
    } else if (key.includes('json')) {
      settingType = 'json';
    }

    // ✅ ПЕРЕТВОРЮЄМО value для boolean
    let stringValue = String(value);
    if (settingType === 'boolean') {
      // Нормалізуємо boolean значення
      const valueStr = String(value).toLowerCase();
      stringValue = (valueStr === 'true' || valueStr === '1') ? 'true' : 'false';
    }

    // ✅ UPSERT - створення або оновлення
    return prisma.siteSettings.upsert({
      where: { key },
      update: { 
        value: stringValue,
        description: description || undefined,
      },
      create: {
        key,
        value: stringValue,
        description: description || `Налаштування: ${key}`,
        type: settingType,
      },
    });
  }

  /**
   * Отримання налаштування з автоматичним створенням якщо не існує
   */
  async getSetting(key: string) {
    // ✅ СПРОБУЄМО ОТРИМАТИ
    let setting = await prisma.siteSettings.findUnique({
      where: { key },
    });

    // ✅ ЯКЩО НЕ ІСНУЄ - СТВОРЮЄМО З ДЕФОЛТНИМ ЗНАЧЕННЯМ
    if (!setting) {
      const defaults: Record<string, { value: string; type: string; description: string }> = {
        storeEnabled: {
          value: 'true',
          type: 'boolean',
          description: 'Статус магазину (включений/вимкнений)',
        },
        storeName: {
          value: 'GoodsXP',
          type: 'text',
          description: 'Назва магазину',
        },
        contactEmail: {
          value: '',
          type: 'text',
          description: 'Контактний email',
        },
        currency: {
          value: 'UAH',
          type: 'text',
          description: 'Валюта магазину',
        },
      };

      const defaultValue = defaults[key];
      if (defaultValue) {
        setting = await prisma.siteSettings.create({
          data: {
            key,
            value: defaultValue.value,
            type: defaultValue.type,
            description: defaultValue.description,
          },
        });
      } else {
        throw new AppError('Налаштування не знайдено', 404);
      }
    }

    return setting;
  }
}
