-- =====================================================
-- RAILWAY DATABASE FIX MIGRATION
-- Версия: 2026-03-19
-- =====================================================
-- Этот скрипт:
-- 1. Добавляет недостающие поля в Product (categoryId, rating)
-- 2. Создаёт таблицу Category если её нет
-- 3. Создаёт таблицу Review если её нет
-- 4. Все новые поля NULLABLE для совместимости
-- =====================================================

-- =====================================================
-- 0. Создаём ENUM типы если их нет
-- =====================================================

DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'SETTINGS_UPDATE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARNING', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LogSource" AS ENUM ('ADMIN_PANEL', 'API', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 1. Создаём таблицу Category если её нет
-- =====================================================

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "Category_slug_idx" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");

-- Foreign key для Category (self-referencing)
DO $$ BEGIN
  ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN NULL;
END $$;

-- =====================================================
-- 2. Создаём таблицу Review если её нет
-- =====================================================

CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");

-- Foreign key для Review -> Product
DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN NULL;
END $$;

-- =====================================================
-- 3. Создаём таблицу SystemLog если её нет
-- =====================================================

CREATE TABLE IF NOT EXISTS "SystemLog" (
  "id" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "level" "LogLevel" NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "userId" TEXT,
  "ipAddress" TEXT,
  "source" "LogSource" NOT NULL DEFAULT 'SYSTEM',
  "metadata" TEXT,

  CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SystemLog_level_idx" ON "SystemLog"("level");
CREATE INDEX IF NOT EXISTS "SystemLog_timestamp_idx" ON "SystemLog"("timestamp");
CREATE INDEX IF NOT EXISTS "SystemLog_source_idx" ON "SystemLog"("source");
CREATE INDEX IF NOT EXISTS "SystemLog_userId_idx" ON "SystemLog"("userId");

-- Foreign key для SystemLog -> User
DO $$ BEGIN
  ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN NULL;
END $$;

-- =====================================================
-- 4. Добавляем недостающие поля в Product
-- =====================================================

-- categoryId (связь с категорией)
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- rating (средний рейтинг товара)
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "rating" DECIMAL(3,2) DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- originalPrice (оригинальная цена для скидок)
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "originalPrice" DECIMAL(10,2);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- discountPrice (цена со скидкой)
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "discountPrice" DECIMAL(10,2);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- isFeatured (флаг "рекомендуемое")
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- isPopular (флаг "популярное")
DO $$ BEGIN
  ALTER TABLE "Product" ADD COLUMN "isPopular" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- =====================================================
-- 5. Создаём индексы для новых полей Product
-- =====================================================

CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "Product_rating_idx" ON "Product"("rating");
CREATE INDEX IF NOT EXISTS "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX IF NOT EXISTS "Product_isPopular_idx" ON "Product"("isPopular");

-- =====================================================
-- 6. Добавляем Foreign Key для Product.categoryId
-- =====================================================

DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN foreign_key_violation THEN NULL;
END $$;

-- =====================================================
-- 7. Обновляем _prisma_migrations для синхронизации
-- =====================================================

-- Создаём таблицу миграций если её нет
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- ПІДСУМОК изменений:
-- =====================================================
-- Таблицы: Category, Review, SystemLog
-- Product: categoryId, rating, originalPrice, discountPrice, isFeatured, isPopular
-- Все поля nullable или с DEFAULT, чтобы не ломать существующие данные
-- =====================================================
