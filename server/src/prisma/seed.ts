import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Запуск seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'goodsxp.net@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'uR4!xZ9@pL2#vQ7$tM8^kW3&cN1*eH5%';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log('✅ Адміністратора створено:', adminEmail);
  } else {
    console.log('ℹ️  Адміністратор вже існує');
  }

  // Create sample products
  const sampleProducts = [
    {
      title: 'Смартфон Premium X1',
      description: 'Флагманський смартфон з передовими технологіями. 6.7" AMOLED дисплей, процесор останнього покоління, 256GB пам\'яті, потрійна камера 108MP. Швидка зарядка 120W, бездротова зарядка, захист IP68.',
      price: 32999,
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1592899677712-a5a25450336c?w=500&h=500&fit=crop',
      ],
      stock: 50,
    },
    {
      title: 'Ноутбук ProBook 15',
      description: 'Потужний ноутбук для роботи та розваг. 15.6" IPS дисплей, Intel Core i7, 16GB RAM, 512GB SSD. Відеокарта NVIDIA GeForce RTX 4060. Легкий і тонкий корпус з алюмінію.',
      price: 54999,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&h=500&fit=crop',
      ],
      stock: 30,
    },
    {
      title: 'Бездротові навушники SoundMax',
      description: 'Преміальні навушники з активним шумоподавленням. До 30 годин роботи, швидка зарядка, підтримка кодеків LDAC та aptX. Зручна посадка, м\'які амбушюри.',
      price: 10499,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop',
      ],
      stock: 100,
    },
    {
      title: 'Розумний годинник FitWatch Pro',
      description: 'Фітнес-годинник з розширеним моніторингом здоров\'я. Вимірювання пульсу, SpO2, ЕКГ. GPS, NFC для безконтактної оплати. Водонепроникність 5ATM. До 14 днів роботи.',
      price: 8499,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop',
      ],
      stock: 75,
    },
    {
      title: 'Планшет TabUltra 11',
      description: 'Універсальний планшет для роботи та розваг. 11" Liquid Retina дисплей, процесор M2, 128GB пам\'яті. Підтримка Apple Pencil та Magic Keyboard. Камера 12MP.',
      price: 24999,
      imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500&h=500&fit=crop',
      ],
      stock: 40,
    },
    {
      title: 'Ігрова консоль GameBox X',
      description: 'Консоль нового покоління для неймовірного геймінгу. 4K@120Hz, трасування променів, SSD 1TB. У комплекті бездротовий контролер та підписка на 3 місяці.',
      price: 20999,
      imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=500&h=500&fit=crop',
      ],
      stock: 25,
    },
    {
      title: 'Камера Mirrorless Z6',
      description: 'Професійна бездзеркальна камера. 24.2MP повнокадрова матриця, 4K відео, стабілізація 5 осей. Швидкий автофокус, серійна зйомка 12 к/с.',
      price: 62999,
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop',
      ],
      stock: 15,
    },
    {
      title: 'Колонка SmartSound Mini',
      description: 'Компактна розумна колонка з голосовим помічником. 360° звук, підтримка мультирум, управління розумним будинком. Стильний дизайн, 6 мікрофонів.',
      price: 3399,
      imageUrl: 'https://images.unsplash.com/photo-1543512214-318c77a07298?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1543512214-318c77a07298?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=500&h=500&fit=crop',
      ],
      stock: 120,
    },
    {
      title: 'Монітор UltraView 27"',
      description: 'Професійний монітор для роботи та геймінгу. 27" IPS матриця, 4K роздільна здатність, 144Hz. HDR10, USB-C hub, вбудовані колонки. Ідеальна кольоропередача.',
      price: 16999,
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=500&h=500&fit=crop',
      ],
      stock: 35,
    },
    {
      title: 'Клавіатура MechType Pro',
      description: 'Механічна клавіатура для професіоналів. Перемикачі Cherry MX Blue, RGB підсвітка, алюмінієвий корпус. Програмовані клавіші, знімний кабель USB-C.',
      price: 4999,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&h=500&fit=crop',
      ],
      stock: 60,
    },
    {
      title: 'Миша GamePro Wireless',
      description: 'Бездротова ігрова миша з точністю 25600 DPI. 70 годин роботи, 8 програмованих кнопок, RGB підсвітка. Ергономічний дизайн для правої руки.',
      price: 2499,
      imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1615663245857-acda5b2b1588?w=500&h=500&fit=crop',
      ],
      stock: 80,
    },
    {
      title: 'Зовнішній SSD DriveMax 1TB',
      description: 'Швидкий зовнішній SSD накопичувач. 1TB пам\'яті, швидкість читання до 1050 МБ/с. USB 3.2 Gen 2, ударостійкий корпус. Компактний розмір.',
      price: 3799,
      imageUrl: 'https://images.unsplash.com/photo-1597872250969-96695b6e6e92?w=500&h=500&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1597872250969-96695b6e6e92?w=500&h=500&fit=crop',
        'https://images.unsplash.com/photo-1628135899446-1f6342479723?w=500&h=500&fit=crop',
      ],
      stock: 90,
    },
  ];

  for (const product of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { title: product.title },
    });

    if (!existing) {
      await prisma.product.create({
        data: product,
      });
      console.log(`✅ Товар створено: ${product.title}`);
    }
  }

  console.log('🎉 Seed завершено успішно!');
}

main()
  .catch((e) => {
    console.error('❌ Помилка seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
