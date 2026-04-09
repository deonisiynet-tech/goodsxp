import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema } from '../utils/validators.js';

export class AuthService {
  async register(email: string, password: string) {
    const validated = registerSchema.parse({ email, password });

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new AppError('Користувач з таким email вже існує', 400);
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const validated = loginSchema.parse({ email, password });

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      throw new AppError('Невірний email або пароль', 401);
    }

    const isPasswordValid = await bcrypt.compare(validated.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Невірний email або пароль', 401);
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  private generateToken(id: string, email: string, role: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT_SECRET не налаштовано. Сервер не може авторизувати запити.', 500);
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign({ id, email, role }, secret, { expiresIn } as jwt.SignOptions);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
          take: 5,
        },
      },
    });

    if (!user) {
      throw new AppError('Користувача не знайдено', 404);
    }

    return user;
  }

  /**
   * Генерація токену для скидання пароля
   * Токен ХЕШУЄТЬся перед збереженням в БД (як паролі bcrypt).
   * Ніколи не повертається клієнту.
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Завжди повертаємо success — не розкриваємо чи існує email
    // Навіть якщо користувача немає — чекаємо фіксований час щоб унеможливити timing attack
    if (!user) {
      // Fake hash щоб витримати однаковий час
      await bcrypt.hash('dummy', 10);
      return { success: true, message: 'Якщо email існує, ви отримаєте посилання для скидання пароля' };
    }

    // Генеруємо криптографічний токен
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 година

    // Хешуємо токен перед збереженням в БД
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    // TODO: Відправити email з посиланням /reset-password?token=xxx
    // resetToken НІКОЛИ не повертається клієнту — тільки в email
    return {
      success: true,
      message: 'Якщо email існує, ви отримаєте посилання для скидання пароля',
    };
  }

  /**
   * Скидання пароля з токеном
   * Порівнює наданий токен з хешем в БД через bcrypt.compare
   */
  async resetPassword(token: string, newPassword: string) {
    // Валідація пароля
    if (!newPassword || typeof newPassword !== 'string') {
      throw new AppError('Пароль обов\'язковий', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('Мінімум 8 символів', 400);
    }
    if (newPassword.length > 128) {
      throw new AppError('Максимум 128 символів', 400);
    }

    // Валідація формату токену
    if (typeof token !== 'string' || token.length < 10) {
      throw new AppError('Недійсний токен', 400);
    }

    // Знаходимо ВСІХ користувачів з ненульовим токеном і порівнюємо bcrypt
    const candidates = await prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpiry: { gte: new Date() },
      },
    });

    let matchedUser: typeof candidates[number] | null = null;
    for (const user of candidates) {
      if (user.passwordResetToken) {
        try {
          const isValid = await bcrypt.compare(token, user.passwordResetToken);
          if (isValid) {
            matchedUser = user;
            break;
          }
        } catch {
          // Ігноруємо помилки порівняння
        }
      }
    }

    if (!matchedUser) {
      throw new AppError('Недійсний або прострочений токен', 400);
    }

    // Оновлюємо пароль та очищуємо токен
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return { success: true, message: 'Пароль змінено' };
  }
}
