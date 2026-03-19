-- =====================================================
-- FIX MISSING createdAt COLUMN IN Product TABLE
-- Railway Production Fix
-- =====================================================
-- Run this SQL directly on Railway PostgreSQL if 
-- prisma migrate deploy doesn't work
-- =====================================================

-- Check if createdAt column exists
DO $$
BEGIN
  -- Add createdAt column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "Product" 
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Added createdAt column to Product table';
  ELSE
    RAISE NOTICE 'createdAt column already exists';
  END IF;
  
  -- Add updatedAt column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Product" 
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Added updatedAt column to Product table';
  ELSE
    RAISE NOTICE 'updatedAt column already exists';
  END IF;
  
  -- Create index on createdAt if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'Product' AND indexname = 'Product_createdAt_idx'
  ) THEN
    CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
    RAISE NOTICE 'Created index on createdAt';
  END IF;
END $$;

-- =====================================================
-- Verify the fix
-- =====================================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;
