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

    console.log('✅ Already applied:', appliedNames.size, 'migrations')

    // Find migrations directory
    let migrationsDir = path.join(__dirname, '../../prisma/migrations')
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.join(__dirname, '../prisma/migrations')
    }
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.join(process.cwd(), 'prisma/migrations')
    }

    console.log('📁 Migrations directory:', migrationsDir)

    if (!fs.existsSync(migrationsDir)) {
      console.warn('⚠️ Migrations directory not found, skipping')
      return
    }

    const migrationDirs = fs.readdirSync(migrationsDir)
      .filter(dir => dir.match(/^\d{14}_/))
      .filter(dir => {
        const fullPath = path.join(migrationsDir, dir)
        return fs.statSync(fullPath).isDirectory()
      })
      .sort()

    console.log('📋 Found migrations:', migrationDirs.length)

    for (const dir of migrationDirs) {
      if (appliedNames.has(dir)) {
        console.log(`⏭️  Skipping ${dir} (already applied)`)
        continue
      }

      console.log(`\n▶️  Applying ${dir}...`)
      const migrationFile = path.join(migrationsDir, dir, 'migration.sql')
      let sql = fs.readFileSync(migrationFile, 'utf-8')

      // Fix TIMESTAMP(3) for PostgreSQL compatibility
      sql = sql.replace(/TIMESTAMP\(3\)/g, 'TIMESTAMPTZ')
      
      // Fix ENUM creation to handle duplicates
      sql = sql.replace(/CREATE TYPE "(\w+)" AS ENUM \(([^)]+)\);/g, (match, typeName, enumValues) => {
        return `DO $$ BEGIN
  CREATE TYPE "${typeName}" AS ENUM (${enumValues});
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`
      })

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(`
          INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
          VALUES ($1, $2, $3, now(), 1)
        `, [dir, '', dir])
        await client.query('COMMIT')
        console.log(`✅ Applied ${dir}`)
      } catch (err: any) {
        await client.query('ROLLBACK')
        
        // Check if it's a "already exists" error - not critical
        if (err.code === '42P07' || err.message.includes('already exists')) {
          console.warn(`⚠️  Objects already exist for ${dir}`)
          await client.query(`
            INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES ($1, $2, $3, now(), 1)
            ON CONFLICT (id) DO NOTHING
          `, [dir, '', dir])
          continue
        }
        
        console.error(`❌ Failed ${dir}:`, err.message)
        throw err
      }
    }

    console.log('\n✅ All migrations completed!')
  } catch (err: any) {
    console.error('❌ Migration error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

if (require.main === module) {
  runMigrations()
}
