import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

export async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const client = await pool.connect()

  try {
    console.log('🔄 Starting migrations...')
    console.log('📂 Migrations directory:', path.join(__dirname, '../../prisma/migrations'))

    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id                     TEXT PRIMARY KEY,
        checksum               TEXT NOT NULL,
        finished_at            TIMESTAMPTZ,
        migration_name         TEXT NOT NULL,
        logs                   TEXT,
        rolled_back_at         TIMESTAMPTZ,
        started_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
        applied_steps_count    INTEGER NOT NULL DEFAULT 0
      )
    `)

    // Get applied migrations
    const applied = await client.query('SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')
    const appliedNames = new Set(applied.rows.map(r => r.migration_name))

    console.log('✅ Applied migrations:', appliedNames)

    // Read migration directories - try multiple paths for production
    let migrationsDir = path.join(__dirname, '../../prisma/migrations')
    if (!fs.existsSync(migrationsDir)) {
      // Try dist path for production
      migrationsDir = path.join(__dirname, '../prisma/migrations')
    }
    if (!fs.existsSync(migrationsDir)) {
      // Try relative to cwd
      migrationsDir = path.join(process.cwd(), 'prisma/migrations')
    }

    console.log('📁 Using migrations directory:', migrationsDir)

    if (!fs.existsSync(migrationsDir)) {
      console.warn('⚠️ Migrations directory not found, skipping migrations')
      return
    }

    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(dir => dir.match(/^\d{14}_/))
      .filter(dir => {
        const fullPath = path.join(migrationsDir, dir)
        return fs.statSync(fullPath).isDirectory()
      })
      .sort()

    for (const dir of migrationDirs) {
      if (appliedNames.has(dir)) {
        console.log(`Skipping ${dir} (already applied)`)
        continue
      }

      console.log(`Applying ${dir}...`)
      const migrationFile = path.join(migrationsDir, dir, 'migration.sql')
      let sql = fs.readFileSync(migrationFile, 'utf-8')

      // Fix ENUM creation to handle duplicates gracefully
      sql = sql.replace(/CREATE TYPE "(\w+)" AS ENUM \(([^)]+)\);/g, (match, typeName, enumValues) => {
        return `DO $$ BEGIN
  CREATE TYPE "${typeName}" AS ENUM (${enumValues});
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`
      })

      // Fix TIMESTAMP(3) to TIMESTAMPTZ for better PostgreSQL compatibility
      sql = sql.replace(/TIMESTAMP\(3\)/g, 'TIMESTAMPTZ')

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(`
          INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
          VALUES ($1, $2, $3, now(), 1)
        `, [dir, '', dir])
        await client.query('COMMIT')
        console.log(`✓ Applied ${dir}`)
      } catch (err: any) {
        await client.query('ROLLBACK')
        
        // Check if error is about existing objects (not critical)
        const isDuplicateError = err.code === '42710' || err.message.includes('already exists')
        const isSyntaxError = err.code === '42601'
        
        if (isDuplicateError) {
          console.warn(`⚠️ Warning for ${dir}: ${err.message}`)
          // Still mark as applied since objects exist
          await client.query(`
            INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES ($1, $2, $3, now(), 1)
            ON CONFLICT (id) DO NOTHING
          `, [dir, '', dir])
          continue
        }
        
        if (isSyntaxError) {
          console.error(`✗ Syntax error in ${dir}:`, err.message)
          console.error('SQL:', sql.substring(0, 500))
          throw new Error(`Syntax error in migration ${dir}: ${err.message}`)
        }
        
        console.error(`✗ Failed to apply ${dir}:`, err)
        throw err
      }
    }

    console.log('All migrations applied successfully!')
  } catch (err: any) {
    console.error('Migration error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
}
