import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';

export async function initializeAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('❌ FATAL: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required!');
      console.error('📝 Set these in your .env file before starting the server.');
      process.exit(1);
    }

    console.log('🔧 Initializing admin user...');
    console.log('📧 Admin email:', adminEmail);

    // Використовуємо select щоб уникнути помилки з відсутніми полями
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (existingAdmin) {
      // Перевіряємо чи потрібно оновити пароль
      const isPasswordValid = await bcrypt.compare(adminPassword, existingAdmin.password);

      if (!isPasswordValid || existingAdmin.role !== 'ADMIN') {
        console.log('🔄 Updating admin password and role...');
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            password: hashedPassword,
            role: 'ADMIN',
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
          role: 'ADMIN',
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
