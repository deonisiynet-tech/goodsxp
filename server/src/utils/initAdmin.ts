import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export async function initializeAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'goodsxp.net@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';

    console.log('🔧 Initializing admin user...');
    console.log('📧 Admin email:', adminEmail);

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      // Перевіряємо чи потрібно оновити пароль
      const isPasswordValid = await bcrypt.compare(adminPassword, existingAdmin.password);
      
      if (!isPasswordValid || existingAdmin.role !== Role.ADMIN) {
        console.log('🔄 Updating admin password and role...');
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            password: hashedPassword,
            role: Role.ADMIN,
          },
        });
        console.log('✅ Admin updated successfully');
      } else {
        console.log('✅ Admin already exists and is valid');
      }
    } else {
      // Створюємо нового адміна
      console.log('📝 Creating new admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: Role.ADMIN,
        },
      });
      console.log('✅ Admin created successfully');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}
