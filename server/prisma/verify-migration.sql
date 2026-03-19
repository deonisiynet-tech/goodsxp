-- =====================================================
-- ПРОВЕРКА БАЗЫ ПОСЛЕ МИГРАЦИИ
-- =====================================================
-- Выполните эти запросы в Railway Console или через psql
-- =====================================================

-- 1. Проверка существования таблицы Review
-- =====================================================
SELECT 
    'Review table exists' as check_name,
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'Review';

-- 2. Проверка структуры таблицы Review
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Review'
ORDER BY ordinal_position;

-- 3. Проверка существования таблицы Category
-- =====================================================
SELECT 
    'Category table exists' as check_name,
    CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'Category';

-- 4. Проверка новых полей в Product
-- =====================================================
SELECT 
    column_name as field,
    data_type as type,
    is_nullable as nullable,
    CASE 
        WHEN column_default IS NOT NULL THEN column_default
        ELSE 'no default'
    END as default_value
FROM information_schema.columns
WHERE table_name = 'Product' 
  AND column_name IN ('categoryId', 'rating', 'originalPrice', 'discountPrice', 'isFeatured', 'isPopular')
ORDER BY ordinal_position;

-- 5. Проверка Foreign Keys для Product
-- =====================================================
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ OK' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('Product', 'Review')
ORDER BY tc.table_name;

-- 6. Проверка индексов для Product
-- =====================================================
SELECT 
    indexname,
    tablename,
    '✅ OK' as status
FROM pg_indexes
WHERE tablename = 'product'
  AND indexname IN (
    'Product_categoryId_idx', 
    'Product_rating_idx',
    'Product_isFeatured_idx',
    'Product_isPopular_idx'
  )
ORDER BY indexname;

-- 7. Проверка индексов для Review
-- =====================================================
SELECT 
    indexname,
    tablename,
    '✅ OK' as status
FROM pg_indexes
WHERE tablename = 'review'
  AND indexname IN (
    'Review_productId_idx',
    'Review_createdAt_idx',
    'Review_rating_idx'
  )
ORDER BY indexname;

-- 8. Проверка количества записей в таблицах
-- =====================================================
SELECT 
    'Product' as table_name,
    COUNT(*) as row_count
FROM "Product"
UNION ALL
SELECT 
    'Review' as table_name,
    COUNT(*) as row_count
FROM "Review"
UNION ALL
SELECT 
    'Category' as table_name,
    COUNT(*) as row_count
FROM "Category"
UNION ALL
SELECT 
    'User' as table_name,
    COUNT(*) as row_count
FROM "User";

-- 9. Проверка применённых миграций Prisma
-- =====================================================
SELECT 
    migration_name,
    started_at,
    finished_at,
    CASE 
        WHEN finished_at IS NOT NULL THEN '✅ Applied'
        ELSE '⏳ Pending'
    END as status
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 10;

-- 10. Пример данных Product с новыми полями
-- =====================================================
SELECT 
    id,
    title,
    price,
    "categoryId",
    rating,
    "originalPrice",
    "discountPrice",
    "isFeatured",
    "isPopular"
FROM "Product"
LIMIT 5;

-- 11. Пример данных Review (если есть)
-- =====================================================
SELECT 
    r.id,
    r.name,
    r.rating,
    r.comment,
    r."createdAt",
    p.title as product_title
FROM "Review" r
LEFT JOIN "Product" p ON r."productId" = p.id
ORDER BY r."createdAt" DESC
LIMIT 10;

-- 12. Пример данных Category (если есть)
-- =====================================================
SELECT 
    id,
    name,
    slug,
    description,
    "parentId"
FROM "Category"
ORDER BY name;

-- =====================================================
-- СВОДКА ПО ПРОВЕРКЕ
-- =====================================================
-- Выполните все запросы по порядку
-- Все статусы должны быть '✅ OK'
-- Если видите '❌ MISSING' — миграция не применилась полностью
-- =====================================================
