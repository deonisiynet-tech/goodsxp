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
  imageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  stock: z.coerce.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const orderSchema = z.object({
  name: z.string().min(1, 'Ім\'я обов\'язкове').max(100),
  phone: z.string().min(5, 'Некоректний телефон').max(20),
  email: z.string().email('Некоректний email'),
  address: z.string().min(1, 'Адреса обов\'язкова').max(500),
  comment: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive().min(1),
    })
  ).min(1, 'Кошик порожній'),
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
