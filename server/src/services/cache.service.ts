import { getRedisClient } from '../prisma/redis.js';

/**
 * Сервіс кешування для оптимізації продуктивності
 */
export class CacheService {
  private static readonly DEFAULT_TTL = 300; // 5 хвилин
  private static readonly CATALOG_TTL = 180; // 3 хвилини для каталогу
  private static readonly PRODUCT_TTL = 600; // 10 хвилин для окремого товару

  /**
   * Отримати дані з кешу
   */
  static async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Зберегти дані в кеш
   */
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Видалити ключ з кешу
   */
  static async del(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  /**
   * Видалити всі ключі за патерном
   */
  static async delPattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Cache delPattern error:', error);
    }
  }

  /**
   * Інвалідувати кеш каталогу
   */
  static async invalidateCatalog(): Promise<void> {
    await this.delPattern('catalog:*');
    await this.delPattern('products:*');
  }

  /**
   * Інвалідувати кеш товару
   */
  static async invalidateProduct(productId: string, slug?: string): Promise<void> {
    await this.del(`product:${productId}`);
    if (slug) {
      await this.del(`product:slug:${slug}`);
    }
    await this.invalidateCatalog();
  }

  /**
   * Інвалідувати кеш категорій
   */
  static async invalidateCategories(): Promise<void> {
    await this.del('categories:all');
  }

  /**
   * Кешувати список товарів
   */
  static async cacheProducts(key: string, data: any): Promise<void> {
    await this.set(key, data, this.CATALOG_TTL);
  }

  /**
   * Кешувати окремий товар
   */
  static async cacheProduct(productId: string, data: any): Promise<void> {
    await this.set(`product:${productId}`, data, this.PRODUCT_TTL);
  }

  /**
   * Кешувати товар за slug
   */
  static async cacheProductBySlug(slug: string, data: any): Promise<void> {
    await this.set(`product:slug:${slug}`, data, this.PRODUCT_TTL);
  }

  /**
   * Кешувати категорії
   */
  static async cacheCategories(data: any): Promise<void> {
    await this.set('categories:all', data, this.PRODUCT_TTL);
  }

  /**
   * Отримати категорії з кешу
   */
  static async getCategories(): Promise<any | null> {
    return this.get('categories:all');
  }
}
