const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function init() {
  try {
    console.log('🔧 Initializing SQLite resilience settings...');
    // In SQLite, PRAGMAs return result sets so $queryRawUnsafe is used
    const walResult = await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
    
    console.log('✅ SQLite Journal Mode:', walResult);

    // Auto-heal admin account if missing or misconfigured
    const adminEmail = (process.env.ADMIN_EMAIL || 'candela@admin.com').trim().toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'Candela2026';
    
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { role: 'ADMIN' },
        ],
      },
    });

    if (!existingAdmin) {
      console.log('👑 Creating default Owner Admin account...');
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await prisma.user.create({
        data: {
          name: 'Candela Owner',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('✅ Default Admin created:', adminEmail);
    } else if (existingAdmin.role !== 'ADMIN') {
      console.log('👑 Elevating account to ADMIN role...');
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
    }

    console.log('✅ Database health check passed.');
  } catch (err) {
    console.error('⚠️ Database init error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

init();
