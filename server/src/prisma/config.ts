import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Завантажуємо .env з кореня проекту
const envPath = path.join(__dirname, '../../../.env')
dotenv.config({ path: envPath })

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Створюємо пул з'єднань з DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Створюємо adapter
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
