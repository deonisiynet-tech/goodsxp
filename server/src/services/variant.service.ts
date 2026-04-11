import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';

interface VariantOptionEntry {
  optionId: string;
  optionValueId: string;
  name: string;
  value: string;
}

interface VariantCreateInput {
  productId: string;
  price: number;
  stock: number;
  image?: string | null;
  options: VariantOptionEntry[];
}

interface VariantUpdateInput {
  price?: number;
  stock?: number;
  image?: string | null;
  options?: VariantOptionEntry[];
}

export class VariantService {
  // ===== OPTIONS =====

  async createOption(productId: string, name: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Товар не знайдено', 404);

    return prisma.productOption.create({
      data: { productId, name },
      include: { values: true },
    });
  }

  async updateOption(optionId: string, name: string) {
    return prisma.productOption.update({
      where: { id: optionId },
      data: { name },
      include: { values: true },
    });
  }

  async deleteOption(optionId: string) {
    return prisma.productOption.delete({ where: { id: optionId } });
  }

  async getOptions(productId: string) {
    return prisma.productOption.findMany({
      where: { productId },
      include: { values: { orderBy: { value: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  // ===== OPTION VALUES =====

  async createOptionValue(optionId: string, value: string) {
    return prisma.productOptionValue.create({
      data: { optionId, value },
    });
  }

  async updateOptionValue(valueId: string, value: string) {
    return prisma.productOptionValue.update({
      where: { id: valueId },
      data: { value },
    });
  }

  async deleteOptionValue(valueId: string) {
    return prisma.productOptionValue.delete({ where: { id: valueId } });
  }

  // ===== VARIANTS =====

  async createVariant(data: VariantCreateInput) {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new AppError('Товар не знайдено', 404);

    return prisma.productVariant.create({
      data: {
        productId: data.productId,
        price: data.price,
        stock: data.stock,
        image: data.image ?? null,
        options: data.options as any,
      },
    });
  }

  async updateVariant(variantId: string, data: VariantUpdateInput) {
    const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new AppError('Варіант не знайдено', 404);

    const updateData: any = {};
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.options !== undefined) updateData.options = data.options;

    return prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });
  }

  async deleteVariant(variantId: string) {
    return prisma.productVariant.delete({ where: { id: variantId } });
  }

  async getVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getVariant(variantId: string) {
    return prisma.productVariant.findUnique({ where: { id: variantId } });
  }

  /**
   * Знаходить варіант за productId + комбінацією optionValueId
   */
  async findVariantByOptions(productId: string, optionValueIds: string[]) {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
    });

    const sorted = [...optionValueIds].sort().join(',');

    for (const v of variants) {
      const vOptions = ((v.options as unknown) as VariantOptionEntry[])
        .map((o) => o.optionValueId)
        .sort()
        .join(',');
      if (vOptions === sorted) return v;
    }
    return null;
  }

  /**
   * Повертає product з variants та options
   */
  async getProductWithVariants(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return null;

    const [options, variants] = await Promise.all([
      this.getOptions(productId),
      this.getVariants(productId),
    ]);

    return {
      ...product,
      options,
      variants,
    };
  }
}
