import { Request, Response } from 'express';
import { PrismaClient, PromoCodeType, ValidityType } from '@prisma/client';

const prisma = new PrismaClient();

export class PromoCodeController {
  // Get all promo codes (admin)
  async getAll(req: Request, res: Response) {
    try {
      const { search, status } = req.query;

      const where: any = {};

      if (search) {
        where.code = {
          contains: String(search),
          mode: 'insensitive',
        };
      }

      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }

      const promoCodes = await prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });

      res.json({ promoCodes });
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
  }

  // Get single promo code by ID (admin)
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({
        where: { id },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });

      if (!promoCode) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      res.json({ promoCode });
    } catch (error: any) {
      console.error('Error fetching promo code:', error);
      res.status(500).json({ error: 'Failed to fetch promo code' });
    }
  }

  // Create new promo code (admin)
  async create(req: Request, res: Response) {
    try {
      const {
        code,
        type,
        value,
        validityType,
        duration,
        startDate,
        endDate,
        maxUsageCount,
        isActive,
      } = req.body;

      // Validation
      if (!code || !type || !value || !validityType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate code format (alphanumeric, dash, underscore only)
      if (!/^[A-Z0-9_-]+$/i.test(code)) {
        return res.status(400).json({
          error: 'Code must contain only letters, numbers, dashes, and underscores',
        });
      }

      // Validate value
      if (Number(value) <= 0) {
        return res.status(400).json({ error: 'Value must be greater than 0' });
      }

      if (type === PromoCodeType.PERCENTAGE && Number(value) > 100) {
        return res.status(400).json({ error: 'Percentage value cannot exceed 100' });
      }

      // Validate validity type requirements
      if (validityType === ValidityType.DAYS || validityType === ValidityType.HOURS) {
        if (!duration || Number(duration) <= 0) {
          return res.status(400).json({ error: 'Duration is required for DAYS/HOURS validity type' });
        }
      }

      if (validityType === ValidityType.DATE_RANGE) {
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'Start and end dates are required for DATE_RANGE validity type' });
        }
        if (new Date(endDate) <= new Date(startDate)) {
          return res.status(400).json({ error: 'End date must be after start date' });
        }
      }

      // Check if code already exists
      const existing = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (existing) {
        return res.status(409).json({ error: 'Promo code already exists' });
      }

      // Create promo code
      const promoCode = await prisma.promoCode.create({
        data: {
          code: code.toUpperCase(),
          type,
          value,
          validityType,
          duration: duration ? Number(duration) : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      res.status(201).json({ promoCode });
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      res.status(500).json({ error: 'Failed to create promo code' });
    }
  }

  // Update promo code (admin)
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        code,
        type,
        value,
        validityType,
        duration,
        startDate,
        endDate,
        maxUsageCount,
        isActive,
      } = req.body;

      // Check if promo code exists
      const existing = await prisma.promoCode.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      // Validate code format if provided
      if (code && !/^[A-Z0-9_-]+$/i.test(code)) {
        return res.status(400).json({
          error: 'Code must contain only letters, numbers, dashes, and underscores',
        });
      }

      // Validate value if provided
      if (value !== undefined) {
        if (Number(value) <= 0) {
          return res.status(400).json({ error: 'Value must be greater than 0' });
        }
        if (type === PromoCodeType.PERCENTAGE && Number(value) > 100) {
          return res.status(400).json({ error: 'Percentage value cannot exceed 100' });
        }
      }

      // Check if code is unique (if changing)
      if (code && code.toUpperCase() !== existing.code) {
        const duplicate = await prisma.promoCode.findUnique({
          where: { code: code.toUpperCase() },
        });
        if (duplicate) {
          return res.status(409).json({ error: 'Promo code already exists' });
        }
      }

      // Update promo code
      const promoCode = await prisma.promoCode.update({
        where: { id },
        data: {
          ...(code && { code: code.toUpperCase() }),
          ...(type && { type }),
          ...(value !== undefined && { value }),
          ...(validityType && { validityType }),
          ...(duration !== undefined && { duration: duration ? Number(duration) : null }),
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(maxUsageCount !== undefined && { maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
      });

      res.json({ promoCode });
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      res.status(500).json({ error: 'Failed to update promo code' });
    }
  }

  // Delete promo code (admin)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const promoCode = await prisma.promoCode.findUnique({ where: { id } });
      if (!promoCode) {
        return res.status(404).json({ error: 'Promo code not found' });
      }

      await prisma.promoCode.delete({ where: { id } });

      res.json({ message: 'Promo code deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      res.status(500).json({ error: 'Failed to delete promo code' });
    }
  }

  // Validate promo code (public - for checkout)
  async validate(req: Request, res: Response) {
    try {
      const { code, orderTotal } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Promo code is required' });
      }

      if (!orderTotal || Number(orderTotal) <= 0) {
        return res.status(400).json({ error: 'Invalid order total' });
      }

      // Find promo code
      const promoCode = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!promoCode) {
        return res.status(404).json({ error: 'Промокод не знайдено' });
      }

      // Check if active
      if (!promoCode.isActive) {
        return res.status(400).json({ error: 'Промокод неактивний' });
      }

      // Check expiration based on validity type
      const now = new Date();

      if (promoCode.validityType === ValidityType.DAYS) {
        const expiryDate = new Date(promoCode.createdAt);
        expiryDate.setDate(expiryDate.getDate() + (promoCode.duration || 0));
        if (now > expiryDate) {
          return res.status(400).json({ error: 'Промокод прострочений' });
        }
      } else if (promoCode.validityType === ValidityType.HOURS) {
        const expiryDate = new Date(promoCode.createdAt);
        expiryDate.setHours(expiryDate.getHours() + (promoCode.duration || 0));
        if (now > expiryDate) {
          return res.status(400).json({ error: 'Промокод прострочений' });
        }
      } else if (promoCode.validityType === ValidityType.DATE_RANGE) {
        if (!promoCode.startDate || !promoCode.endDate) {
          return res.status(400).json({ error: 'Промокод має невірну конфігурацію' });
        }
        if (now < promoCode.startDate) {
          return res.status(400).json({ error: 'Промокод ще не активний' });
        }
        if (now > promoCode.endDate) {
          return res.status(400).json({ error: 'Промокод прострочений' });
        }
      }

      // Check usage limit
      if (promoCode.maxUsageCount !== null && promoCode.currentUsage >= promoCode.maxUsageCount) {
        return res.status(400).json({ error: 'Промокод вичерпано' });
      }

      // Calculate discount
      let discount = 0;
      if (promoCode.type === PromoCodeType.PERCENTAGE) {
        discount = (Number(orderTotal) * Number(promoCode.value)) / 100;
      } else if (promoCode.type === PromoCodeType.FIXED) {
        discount = Number(promoCode.value);
      }

      // Ensure discount doesn't exceed order total
      discount = Math.min(discount, Number(orderTotal));
      discount = Math.round(discount * 100) / 100; // Round to 2 decimals

      res.json({
        valid: true,
        discount,
        promoCodeId: promoCode.id,
        code: promoCode.code,
      });
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      res.status(500).json({ error: 'Помилка перевірки промокоду' });
    }
  }
}
