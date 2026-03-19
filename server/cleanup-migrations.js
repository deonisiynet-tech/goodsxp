const { Client } = require('pg');

async function cleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔌 Connected to database');

    const result = await client.query('DELETE FROM "_prisma_migrations"');
    console.log(`✅ Deleted ${result.rowCount} migration records`);

    const check = await client.query('SELECT * FROM "_prisma_migrations"');
    console.log(`📊 Remaining migrations: ${check.rowCount}`);

    console.log('\n🎉 Cleanup complete! Restart the server to apply new migrations.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanup();
