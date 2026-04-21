import prisma from '../src/prisma/client.js';

/**
 * Міграція існуючих фото з Product.images в ProductImage
 * Запускати один раз після деплою нової версії
 */
async function migrateProductImages() {
  console.log('🔄 Початок міграції фото товарів...');

  try {
    const products = await prisma.product.findMany({
      where: {
        images: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    console.log(`📦 Знайдено ${products.length} товарів з фото`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Перевірка чи вже мігровано
      const existingImages = await prisma.productImage.findMany({
        where: { productId: product.id },
      });

      if (existingImages.length > 0) {
        console.log(`⏭️  Пропускаємо "${product.title}" - вже мігровано`);
        skippedCount++;
        continue;
      }

      // Створюємо записи ProductImage
      const imagesToCreate = product.images.map((url, index) => ({
        productId: product.id,
        imageUrl: url,
        variantValue: null, // Універсальні фото
        position: index,
      }));

      await prisma.productImage.createMany({
        data: imagesToCreate,
      });

      console.log(`✅ Мігровано "${product.title}" - ${imagesToCreate.length} фото`);
      migratedCount++;
    }

    console.log('\n📊 Результати міграції:');
    console.log(`✅ Мігровано: ${migratedCount} товарів`);
    console.log(`⏭️  Пропущено: ${skippedCount} товарів`);
    console.log('🎉 Міграція завершена успішно!');
  } catch (error) {
    console.error('❌ Помилка міграції:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateProductImages();
