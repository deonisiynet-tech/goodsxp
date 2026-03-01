import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    const secret = process.env.JWT_SECRET as string || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign({ id, email, role }, secret, {
      expiresIn
    });
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
}
