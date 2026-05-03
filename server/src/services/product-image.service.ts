import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

interface ProductImageInput {
  imageUrl: string;
  variantValue?: string | null;
  position?: number;
}

export class ProductImageService {
  /**
   * Отримати всі фото товару
   */
  async getProductImages(productId: string) {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });
    return images;
  }

  /**
   * Отримати фото для конкретного варіанту
   */
  async getImagesForVariant(productId: string, variantValue: string | null) {
    const images = await prisma.productImage.findMany({
      where: {
        productId,
        OR: [
          { variantValue: null }, // Універсальні фото
          { variantValue }, // Фото конкретного варіанту
        ],
      },
      orderBy: { position: 'asc' },
    });
    return images;
  }

  /**
   * Додати фото до товару
   */
  async addImage(productId: string, data: ProductImageInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    const maxPosition = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const image = await prisma.productImage.create({
      data: {
        productId,
        imageUrl: data.imageUrl,
        variantValue: data.variantValue ?? null,
        position: data.position ?? (maxPosition?.position ?? 0) + 1,
      },
    });

    return image;
  }

  /**
   * Оновити прив'язку фото до варіанту
   */
  async updateImageVariant(imageId: string, variantValue: string | null) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      throw new AppError('Фото не знайдено', 404);
    }

    const updated = await prisma.productImage.update({
      where: { id: imageId },
      data: { variantValue },
    });

    return updated;
  }

  /**
   * Видалити всі фото товару (для синхронізації)
   */
  async clearProductImages(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Товар не знайдено', 404);
    }

    const deleted = await prisma.productImage.deleteMany({
      where: { productId },
    });

    console.log(`🗑️ Cleared ${deleted.count} ProductImage records for product ${productId}`);
    return { success: true, deleted: deleted.count };
  }

  /**
   * Видалити фото
   */
  async deleteImage(imageId: string) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) {
      throw new AppError('Фото не знайдено', 404);
    }

    await prisma.productImage.delete({ where: { id: imageId } });
    return { success: true };
  }

  /**
   * Оновити позиції фото
   */
  async updatePositions(productId: string, imageIds: string[]) {
    const images = await prisma.productImage.findMany({
      where: { productId, id: { in: imageIds } },
    });

    if (images.length !== imageIds.length) {
      throw new AppError('Деякі фото не знайдено', 404);
    }

    await Promise.all(
      imageIds.map((id, index) =>
        prisma.productImage.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return { success: true };
  }

  /**
   * Міграція: перенести існуючі фото з Product.images в ProductImage
   */
  async migrateProductImages(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    if (!product || !product.images || product.images.length === 0) {
      return { migrated: 0 };
    }

    const existingImages = await prisma.productImage.findMany({
      where: { productId },
    });

    if (existingImages.length > 0) {
      return { migrated: 0, message: 'Фото вже мігровані' };
    }

    const imagesToCreate = product.images.map((url, index) => ({
      productId,
      imageUrl: url,
      variantValue: null,
      position: index,
    }));

    await prisma.productImage.createMany({
      data: imagesToCreate,
    });

    return { migrated: imagesToCreate.length };
  }
}

export const productImageService = new ProductImageService();
