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

    console.log('Applied migrations:', appliedNames)

    // Read migration directories
    const migrationsDir = path.join(__dirname, '../../prisma/migrations')
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
      const sql = fs.readFileSync(migrationFile, 'utf-8')

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(`
          INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
          VALUES ($1, $2, $3, now(), 1)
        `, [dir, '', dir])
        await client.query('COMMIT')
        console.log(`✓ Applied ${dir}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`✗ Failed to apply ${dir}:`, err)
        throw err
      }
    }

    console.log('All migrations applied successfully!')
  } catch (err) {
    console.error('Migration error:', err)
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
