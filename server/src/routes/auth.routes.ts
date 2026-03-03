import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/profile', authenticate, controller.getProfile);

// Тимчасовий endpoint для створення адміна (видалити після використання!)
router.post('/create-admin', async (req, res) => {
  const { PrismaClient } = await import('@prisma/client');
  const bcrypt = await import('bcryptjs');
  const prisma = new PrismaClient();
  
  try {
    const email = 'goodsxp.net@gmail.com';
    const password = 'Admin123';
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingAdmin) {
      // Оновлюємо пароль
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword, role: Role.ADMIN },
      });
      return res.json({ message: 'Адмін оновлений', email });
    } else {
      // Створюємо нового
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: Role.ADMIN,
        },
      });
      return res.json({ message: 'Адмін створений', email });
    }
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ error: 'Помилка створення адміна' });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
