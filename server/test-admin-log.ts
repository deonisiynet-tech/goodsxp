/**
 * Test script to verify AdminLog table exists and works
 * Run with: npx ts-node test-admin-log.ts
 */

import prisma from './prisma/client.js';

async function testAdminLog() {
  console.log('🧪 Testing AdminLog table...\n');

  try {
    // 1. Check if AdminLog table exists
    console.log('1. Checking if AdminLog table exists...');
    const adminLogCount = await prisma.adminLog.count();
    console.log(`   ✅ AdminLog table exists! Current count: ${adminLogCount}`);
  } catch (error: any) {
    console.error(`   ❌ AdminLog table error: ${error.message}`);
    console.error('   💡 Try running: npx prisma migrate deploy');
    process.exit(1);
  }

  // 2. Check if there are any admins
  console.log('\n2. Checking for ADMIN users...');
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  });

  if (!admin) {
    console.log('   ⚠️ No ADMIN user found. Creating one...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin123', 12);
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@goodsxp.store',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`   ✅ Created admin: ${newAdmin.email} (ID: ${newAdmin.id})`);
  } else {
    console.log(`   ✅ Found admin: ${admin.email} (ID: ${admin.id})`);
  }

  // 3. Create a test log entry
  console.log('\n3. Creating test log entry...');
  try {
    const testLog = await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'LOGIN',
        entity: null,
        entityId: null,
        details: 'Test log entry from test script',
        ipAddress: '127.0.0.1',
        userAgent: 'TestScript/1.0',
      },
    });
    console.log(`   ✅ Test log created: ${testLog.id}`);
  } catch (error: any) {
    console.error(`   ❌ Failed to create test log: ${error.message}`);
    process.exit(1);
  }

  // 4. Get recent logs
  console.log('\n4. Getting recent logs...');
  const logs = await prisma.adminLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      admin: {
        select: { email: true },
      },
    },
  });

  if (logs.length === 0) {
    console.log('   ⚠️ No logs found');
  } else {
    console.log(`   ✅ Found ${logs.length} recent logs:`);
    logs.forEach((log) => {
      console.log(`      - ${log.action} by ${log.admin.email} at ${log.createdAt.toISOString()}`);
    });
  }

  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}

testAdminLog().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
