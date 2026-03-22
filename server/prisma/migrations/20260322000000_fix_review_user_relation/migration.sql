-- AlterTable
-- Add userId column to Review table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Review' AND column_name = 'userId') THEN
        ALTER TABLE "Review" ADD COLUMN "userId" TEXT;
    END IF;
END $$;

-- AddForeignKey
-- Add foreign key constraint for userId if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Review_userId_fkey' AND table_name = 'Review'
    ) THEN
        ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex
-- Add index on userId if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'Review_userId_idx' AND tablename = 'Review'
    ) THEN
        CREATE INDEX "Review_userId_idx" ON "Review"("userId");
    END IF;
END $$;
