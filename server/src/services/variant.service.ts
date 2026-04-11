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

/** Normalize optionValueIds for comparison (sorted, deduplicated) */
function normalizeOptionValueIds(ids: string[]): string {
  return [...new Set(ids)].sort().join(',');
}

export class VariantService {
  // ===== OPTIONS =====

  async createOption(productId: string, name: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Товар не знайдено', 404);

    // Check for duplicate option name on the same product
    const existing = await prisma.productOption.findFirst({
      where: { productId, name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) throw new AppError(`Опція "${name}" вже існує для цього товару`, 400);

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
    const option = await prisma.productOption.findUnique({ where: { id: optionId } });
    if (!option) throw new AppError('Опцію не знайдено', 404);

    // Check for duplicate value on the same option
    const existing = await prisma.productOptionValue.findFirst({
      where: { optionId, value: { equals: value, mode: 'insensitive' } },
    });
    if (existing) throw new AppError(`Значення "${value}" вже існує для цієї опції`, 400);

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

    if (!data.options || data.options.length === 0) {
      throw new AppError('Варіант повинен мати хоча б одну характеристику', 400);
    }

    // Validate that all optionValueIds exist and belong to the product's options
    const optionValueIds = data.options.map((o) => o.optionValueId);
    const optionIds = data.options.map((o) => o.optionId);

    const [optionValues, options] = await Promise.all([
      prisma.productOptionValue.findMany({ where: { id: { in: optionValueIds } } }),
      prisma.productOption.findMany({ where: { id: { in: optionIds }, productId: data.productId } }),
    ]);

    if (optionValues.length !== optionValueIds.length) {
      const foundIds = new Set(optionValues.map((v) => v.id));
      const missing = optionValueIds.filter((id) => !foundIds.has(id));
      throw new AppError(`Недійсні optionValueId: ${missing.join(', ')}`, 400);
    }

    if (options.length !== optionIds.length) {
      const foundIds = new Set(options.map((o) => o.id));
      const missing = optionIds.filter((id) => !foundIds.has(id));
      throw new AppError(`Недійсні optionId або не належать цьому товару: ${missing.join(', ')}`, 400);
    }

    // Check for duplicate variant combination
    const normalizedIds = normalizeOptionValueIds(optionValueIds);
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: data.productId },
      select: { id: true, options: true },
    });

    for (const existing of existingVariants) {
      const existingOptions = (existing.options as unknown as VariantOptionEntry[])
        .map((o) => o.optionValueId);
      const existingNormalized = normalizeOptionValueIds(existingOptions);
      if (existingNormalized === normalizedIds) {
        const existingValues = (existing.options as unknown as VariantOptionEntry[])
          .map((o) => o.value)
          .join(', ');
        throw new AppError(`Варіант з такими характеристиками вже існує: ${existingValues}`, 400);
      }
    }

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
    if (data.options !== undefined) {
      // If updating options, validate and check for duplicates
      const productVariants = await prisma.productVariant.findMany({
        where: { productId: existing.productId },
        select: { id: true, options: true },
      });

      const newOptionValueIds = data.options.map((o) => o.optionValueId);
      const newNormalized = normalizeOptionValueIds(newOptionValueIds);

      for (const pv of productVariants) {
        if (pv.id === variantId) continue; // skip self
        const pvOptions = (pv.options as unknown as VariantOptionEntry[]);
        const pvNormalized = normalizeOptionValueIds(pvOptions.map((o) => o.optionValueId));
        if (pvNormalized === newNormalized) {
          const existingValues = pvOptions.map((o) => o.value).join(', ');
          throw new AppError(`Варіант з такими характеристиками вже існує: ${existingValues}`, 400);
        }
      }

      updateData.options = data.options;
    }

    return prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });
  }

  async deleteVariant(variantId: string) {
    const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new AppError('Варіант не знайдено', 404);
    return prisma.productVariant.delete({ where: { id: variantId } });
  }

  async getVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getVariant(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new AppError('Варіант не знайдено', 404);
    return variant;
  }

  /**
   * Знаходить варіант за productId + комбінацією optionValueIds.
   * Порівнює нормалізовані (сортовані) списки ID.
   */
  async findVariantByOptions(productId: string, optionValueIds: string[]) {
    if (!optionValueIds || optionValueIds.length === 0) {
      throw new AppError('optionValueIds не можуть бути порожніми', 400);
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
    });

    const normalizedSearch = normalizeOptionValueIds(optionValueIds);

    for (const v of variants) {
      const vOptions = ((v.options as unknown) as VariantOptionEntry[])
        .map((o) => o.optionValueId);
      const vNormalized = normalizeOptionValueIds(vOptions);
      if (vNormalized === normalizedSearch) return v;
    }
    return null;
  }

  /**
   * Знаходить варіант за variantId з перевіркою productId.
   */
  async findVariantByIdForProduct(variantId: string, productId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) return null;
    if (variant.productId !== productId) return null;
    return variant;
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
