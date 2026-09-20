const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load .env variables if not already set
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  }
} catch {}

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
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@candela.store').trim().toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'candela2024';
    
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
