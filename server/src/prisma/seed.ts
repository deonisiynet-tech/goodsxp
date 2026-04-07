import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import pg, { Pool } from 'pg';

// Завантажуємо .env з кореня проекту
const envPath = path.join(__dirname, '../../../.env')
dotenv.config({ path: envPath })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

async function main() {
  console.log('🌱 Запуск seed (SQL)...');

  // ===== КАТЕГОРІЇ =====
  const categories = [
    { name: 'Смарт-годинники', slug: 'smart-watches', description: 'Розумні годинники та фітнес-браслети' },
    { name: 'Навушники', slug: 'headphones', description: 'Бездротові та дротові навушники' },
    { name: 'Павербанки', slug: 'powerbanks', description: 'Портативні зарядні пристрої' },
    { name: 'Аксесуари', slug: 'accessories', description: 'Чохли, кабелі, зарядки, тримачі' },
    { name: 'Гаджети', slug: 'gadgets', description: 'Корисні електронні гаджети' },
    { name: 'Техніка для дому', slug: 'home-appliances', description: 'Електроніка для дому та побуту' },
  ];

  const categoryIds: Record<string, string> = {};

  for (const cat of categories) {
    const existing = await pool.query('SELECT id FROM "Category" WHERE slug = $1', [cat.slug]);
    if (existing.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO "Category" (id, name, slug, description, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING id`,
        [cat.name, cat.slug, cat.description]
      );
      categoryIds[cat.slug] = result.rows[0].id;
      console.log(`✅ Категорію створено: ${cat.name}`);
    } else {
      categoryIds[cat.slug] = existing.rows[0].id;
      console.log(`ℹ️  Категорія вже існує: ${cat.name}`);
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'goodsxp.net@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';

  // Check if admin exists
  const adminResult = await pool.query('SELECT id FROM "User" WHERE email = $1', [adminEmail]);
  
  if (adminResult.rows.length === 0) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await pool.query(
      'INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())',
      [adminEmail, hashedPassword, 'ADMIN']
    );
    console.log('✅ Адміністратора створено:', adminEmail);
  } else {
    console.log('ℹ️  Адміністратор вже існує');
  }

  const sampleProducts = [
    {
      title: 'FitWatch Pro — Розумний годинник',
      description: 'Фітнес-годинник з розширеним моніторингом здоров\'я. Вимірювання пульсу, SpO2, ЕКГ. GPS, NFC для безконтактної оплати. Водонепроникність 5ATM. До 14 днів роботи.',
      price: 2499,
      originalPrice: 3499,
      discountPrice: 2499,
      categorySlug: 'smart-watches',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=800&fit=crop',
      ],
      stock: 75,
      isPopular: true,
    },
    {
      title: 'SmartBand Lite — Фітнес-браслет',
      description: 'Легкий фітнес-браслет для щоденного використання. Моніторинг сну, кроки, калорії. Сповіщення з телефону. До 20 днів роботи без підзарядки.',
      price: 999,
      originalPrice: null,
      discountPrice: null,
      categorySlug: 'smart-watches',
      imageUrl: 'https://images.unsplash.com/photo-1575311373937-0d5e9e5f133f?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1575311373937-0d5e9e5f133f?w=800&h=800&fit=crop',
      ],
      stock: 120,
      isPopular: false,
    },
    {
      title: 'SoundMax Pro — Бездротові навушники',
      description: 'Преміальні навушники з активним шумоподавленням. До 30 годин роботи, швидка зарядка, підтримка кодеків LDAC та aptX. Зручна посадка, м\'які амбушюри.',
      price: 1899,
      originalPrice: 2499,
      discountPrice: 1899,
      categorySlug: 'headphones',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
      ],
      stock: 100,
      isPopular: true,
      isFeatured: true,
    },
    {
      title: 'TWS Mini — Бездротові навушники',
      description: 'Компактні TWS навушники в стильному кейсі. Bluetooth 5.3, сенсорне управління, мікрофон. До 6 годин роботи + 24 години від кейсу.',
      price: 699,
      originalPrice: 999,
      discountPrice: 699,
      categorySlug: 'headphones',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&h=800&fit=crop',
      ],
      stock: 150,
      isPopular: true,
    },
    {
      title: 'PowerCore 20000mAh — Павербанк',
      description: 'Потужний павербанк на 20000mAh. Два USB-порти, швидка зарядка 22.5W. LED-індикатор рівня заряду. Компактний розмір для подорожей.',
      price: 899,
      originalPrice: 1199,
      discountPrice: 899,
      categorySlug: 'powerbanks',
      imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9c1565?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1609091839311-d5365f9c1565?w=800&h=800&fit=crop',
      ],
      stock: 200,
      isPopular: true,
    },
    {
      title: 'PowerSlim 10000mAh — Ультратонкий павербанк',
      description: 'Найтонший павербанк з ємністю 10000mAh. Вага всього 180г. Бездротова зарядка Qi. Ідеально підходить для щоденного використання.',
      price: 599,
      originalPrice: null,
      discountPrice: null,
      categorySlug: 'powerbanks',
      imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40650899?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1617788138017-80ad40650899?w=800&h=800&fit=crop',
      ],
      stock: 80,
      isPopular: false,
    },
    {
      title: 'Бездротова зарядка 3-в-1',
      description: 'Зарядна станція для телефону, годинника та навушників одночасно. Qi-сумісність, потужність 15W. Стильний дизайн для робочого столу.',
      price: 799,
      originalPrice: 1099,
      discountPrice: 799,
      categorySlug: 'accessories',
      imageUrl: 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=800&h=800&fit=crop',
      ],
      stock: 60,
      isPopular: false,
    },
    {
      title: 'Автомобільний тримач MagSafe',
      description: 'Магнітний тримач для телефону в авто. Сумісний з MagSafe. Міцне кріплення на вентиляційну решітку. Обертання на 360°.',
      price: 399,
      originalPrice: null,
      discountPrice: null,
      categorySlug: 'accessories',
      imageUrl: 'https://images.unsplash.com/photo-1592899677712-a5a25450336c?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1592899677712-a5a25450336c?w=800&h=800&fit=crop',
      ],
      stock: 90,
      isPopular: false,
    },
    {
      title: 'Bluetooth колонка SoundBox',
      description: 'Портативна Bluetooth-колонка з потужним звуком. Водонепроникність IPX7, до 12 годин роботи. Вбудований мікрофон, RGB підсвітка.',
      price: 1299,
      originalPrice: 1699,
      discountPrice: 1299,
      categorySlug: 'gadgets',
      imageUrl: 'https://images.unsplash.com/photo-1543512214-318c77a07298?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1543512214-318c77a07298?w=800&h=800&fit=crop',
        'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&h=800&fit=crop',
      ],
      stock: 45,
      isPopular: true,
      isFeatured: true,
    },
    {
      title: 'Розумна LED лампа',
      description: 'Wi-Fi лампа з керуванням через додаток. 16 мільйонів кольорів, таймер, сумісність з Alexa/Google Home. Стандартний цоколь E27.',
      price: 299,
      originalPrice: null,
      discountPrice: null,
      categorySlug: 'gadgets',
      imageUrl: 'https://images.unsplash.com/photo-1565849904461-04e7d6c5e65d?w=800&h=800&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1565849904461-04e7d6c5e65d?w=800&h=800&fit=crop',
      ],
      stock: 200,
      isPopular: false,
    },
  ];

  for (const product of sampleProducts) {
    const existing = await pool.query('SELECT id FROM "Product" WHERE title = $1', [product.title]);

    if (existing.rows.length === 0) {
      const slug = generateSlug(product.title);
      const categoryId = categoryIds[product.categorySlug] || null;
      const imagesPg = `{${product.images.map((img: string) => `"${img.replace(/"/g, '\\"')}"`).join(',')}}`;

      await pool.query(
        `INSERT INTO "Product" (id, title, slug, description, price, "originalPrice", "discountPrice", "categoryId", "imageUrl", images, stock, "isFeatured", "isPopular", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())`,
        [
          product.title,
          slug,
          product.description,
          product.price,
          product.originalPrice,
          product.discountPrice,
          categoryId,
          product.imageUrl,
          imagesPg,
          product.stock,
          product.isFeatured || false,
          product.isPopular || false,
        ]
      );
      console.log(`✅ Товар створено: ${product.title} (категорія: ${product.categorySlug})`);
    } else {
      console.log(`ℹ️  Товар вже існує: ${product.title}`);
    }
  }

  console.log('🎉 Seed завершено успішно!');
  await pool.end();
}

main()
  .catch((e) => {
    console.error('❌ Помилка seed:', e);
    process.exit(1);
  });
