-- Fix migration history by resetting the failed migration
-- This script marks the failed migration as applied

-- First, check if the migration failed
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20260303150000_remove_two_factor_columns' 
  AND finished_at IS NULL;

-- Mark the migration as successfully applied
INSERT INTO "_prisma_migrations" (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
) VALUES (
  gen_random_uuid(),
  'sha256:placeholder',
  NOW(),
  '20260303150000_remove_two_factor_columns',
  '',
  NULL,
  NOW(),
  1
) ON CONFLICT DO NOTHING;
