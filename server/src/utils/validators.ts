import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(6, 'Пароль має містити мінімум 6 символів'),
});

export const loginSchema = z.object({
  email: z.string().email('Некоректний email'),
  password: z.string().min(1, 'Пароль обов\'язковий'),
});

export const productSchema = z.object({
  title: z.string().min(1, 'Назва обов\'язкова').max(200),
  description: z.string().min(1, 'Опис обов\'язковий').max(5000),
  price: z.coerce.number().positive('Ціна має бути додатною'),
  margin: z.coerce.number().min(0, 'Маржа не може бути менше 0').optional().default(0),
  categoryId: z.string().uuid().optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  originalPrice: z.coerce.number().positive().optional().nullable(),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  isPopular: z.boolean().optional().default(false),
  imageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  stock: z.coerce.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const orderSchema = z.object({
  name: z.string().min(1, 'Ім\'я обов\'язкове').max(100),
  phone: z.string().min(5, 'Некоректний телефон').max(20),
  email: z.string().email('Некоректний email').optional().nullable(),
  address: z.string().min(1, 'Адреса обов\'язкова').max(500).optional().nullable(),
  city: z.string().min(1, 'Місто обов\'язкове').max(200).optional().nullable(),
  warehouse: z.string().min(1, 'Відділення обов\'язкове').max(200).optional().nullable(),
  warehouseAddress: z.string().min(1, 'Адреса відділення обов\'язкова').max(500).optional().nullable(),
  comment: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive().min(1),
    })
  ).min(1, 'Кошик порожній'),
}).refine((data) => {
  // Перевірка: або address, або city+warehouse мають бути заповнені
  return (data.address && data.address.length > 0) ||
         (data.city && data.warehouse);
}, {
  message: 'Вкажіть адресу доставки або оберіть відділення Нової Пошти',
  path: ['address'],
});

export const orderStatusSchema = z.object({
  status: z.enum(['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export const paginationSchema = z.object({
  page: z.coerce.number().positive().int().optional().default(1),
  limit: z.coerce.number().positive().int().max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'price', 'title', 'popularity']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
});
