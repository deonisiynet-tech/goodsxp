import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const client = await pool.connect()

  try {
    console.log('🔍 Перевірка бази даних PostgreSQL...\n')

    // Перевірка таблиць
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    const tablesResult = await client.query(tablesQuery)
    const existingTables = new Set(tablesResult.rows.map(r => r.table_name))

    console.log('📊 Існуючі таблиці:')
    console.log('  ', Array.from(existingTables).join(', '))
    console.log()

    // Очікувані таблиці з Prisma
    const expectedTables = [
      'User', 'Product', 'Order', 'OrderItem', 'Category', 'Review',
      'AdminLog', 'SystemLog', 'SiteSettings', '_prisma_migrations'
    ]

    const missingTables = expectedTables.filter(t => !existingTables.has(t))
    let missingProductColumns: string[] = []

    if (missingTables.length > 0) {
      console.log('❌ Відсутні таблиці:')
      console.log('  ', missingTables.join(', '))
      console.log()
    } else {
      console.log('✅ Всі таблиці присутні')
      console.log()
    }

    // Перевірка колонок Product
    if (existingTables.has('Product')) {
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Product'
        ORDER BY ordinal_position
      `
      const columnsResult = await client.query(columnsQuery)
      const productColumns = columnsResult.rows.map(r => ({
        name: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === 'YES'
      }))

      console.log('📦 Колонки таблиці Product:')
      productColumns.forEach(c => {
        console.log(`  - ${c.name} (${c.type})${c.nullable ? ' [NULL]' : ''}`)
      })
      console.log()

      // Очікувані колонки Product
      const expectedProductColumns = [
        'id', 'title', 'description', 'price', 'originalPrice', 'discountPrice',
        'isFeatured', 'isPopular', 'imageUrl', 'images', 'stock', 'isActive',
        'createdAt', 'updatedAt'
      ]

      missingProductColumns = expectedProductColumns.filter(c => 
        !productColumns.some(pc => pc.name === c)
      )

      if (missingProductColumns.length > 0) {
        console.log('❌ Відсутні колонки в Product:')
        console.log('  ', missingProductColumns.join(', '))
        console.log()
      } else {
        console.log('✅ Всі колонки Product присутні')
        console.log()
      }
    }

    // Перевірка таблиці Review
    if (existingTables.has('Review')) {
      const reviewColumnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Review'
        ORDER BY ordinal_position
      `
      const reviewColumnsResult = await client.query(reviewColumnsQuery)
      const reviewColumns = reviewColumnsResult.rows.map(r => ({
        name: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === 'YES'
      }))

      console.log('💬 Колонки таблиці Review:')
      reviewColumns.forEach(c => {
        console.log(`  - ${c.name} (${c.type})${c.nullable ? ' [NULL]' : ''}`)
      })
      console.log()
    } else {
      console.log('❌ Таблиця Review відсутня')
      console.log()
    }

    // Перевірка застосованих міграцій
    if (existingTables.has('_prisma_migrations')) {
      const migrationsQuery = `
        SELECT migration_name, finished_at
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
        ORDER BY started_at
      `
      const migrationsResult = await client.query(migrationsQuery)
      
      console.log('📜 Застосовані міграції:')
      if (migrationsResult.rows.length === 0) {
        console.log('  (немає застосованих міграцій)')
      } else {
        migrationsResult.rows.forEach(m => {
          console.log(`  - ${m.migration_name} (${m.finished_at})`)
        })
      }
      console.log()
    } else {
      console.log('❌ Таблиця _prisma_migrations відсутня')
      console.log()
    }

    // Підсумок
    console.log('='.repeat(60))
    console.log('ПІДСУМОК:')
    if (missingTables.length > 0 || missingProductColumns.length > 0) {
      console.log('❌ Потрібно застосувати міграції')
      console.log('   Виконайте: npm run migrate (локально)')
      console.log('   або перевірте логи Railway')
    } else {
      console.log('✅ База даних синхронізована зі схемою Prisma')
    }
    console.log('='.repeat(60))

  } catch (err: any) {
    console.error('❌ Помилка перевірки:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

checkDatabase()
