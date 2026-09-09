import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { STATIC_PRODUCTS } from "./data";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbReadyPromise: Promise<void> | undefined;
};

function getDbUrl(): string {
  // If remote PostgreSQL (Neon/Vercel Postgres) is provided, use it directly
  if (process.env.POSTGRES_PRISMA_URL) {
    return process.env.POSTGRES_PRISMA_URL;
  }

  // If remote external URL is provided, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // If on Vercel / serverless (where root filesystem is read-only)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join("/tmp", "candela-dev.db");
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const candidates = [
          path.join(process.cwd(), "public", "dev.db"),
          path.join(process.cwd(), "prisma", "dev.db"),
          path.join("/var/task", "public", "dev.db"),
          path.join("/var/task", "prisma", "dev.db"),
          path.join(__dirname, "..", "public", "dev.db"),
          path.join(__dirname, "..", "prisma", "dev.db"),
        ];

        let copied = false;
        for (const candidate of candidates) {
          try {
            if (fs.existsSync(/*turbopackIgnore: true*/ candidate) && fs.statSync(/*turbopackIgnore: true*/ candidate).size > 0) {
              fs.copyFileSync(candidate, tmpDbPath);
              console.log(`Successfully copied seed database from ${candidate} to ${tmpDbPath}`);
              copied = true;
              break;
            }
          } catch {}
        }
        if (!copied) {
          console.warn("No existing seed SQLite database found. Will auto-create schema via DDL.");
        }
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.warn("Could not setup SQLite in /tmp:", err);
    }
  }

  // Local development fallback with absolute path
  const localDb = path.resolve(process.cwd(), "prisma", "dev.db");
  return `file:${localDb}`;
}

const resolvedUrl = getDbUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Always retain prisma client as singleton across requests
globalForPrisma.prisma = prisma;

const SCHEMA_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "notes" TEXT,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fromOwner" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "productId" TEXT,
    "deviceType" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SiteSetting_key_key" ON "SiteSetting"("key")`,
];

export async function ensureDbReady(): Promise<void> {
  if (globalForPrisma.dbReadyPromise) {
    return globalForPrisma.dbReadyPromise;
  }

  globalForPrisma.dbReadyPromise = (async () => {
    const isPostgres = Boolean(
      process.env.POSTGRES_PRISMA_URL ||
      (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:"))
    );

    try {
      // Test if table User exists using pure Prisma ORM
      await prisma.user.findFirst({ select: { id: true } });
    } catch {
      if (!isPostgres) {
        console.log("⚡ Auto-initializing SQLite database schema...");
        for (const statement of SCHEMA_DDL_STATEMENTS) {
          try {
            await prisma.$executeRawUnsafe(statement);
          } catch (err) {
            console.warn("DDL execution warning:", err);
          }
        }
      }
    }

    try {
      // Ensure admin exists
      const adminEmail = "admin@candela.store";
      const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            email: adminEmail,
            password: "$2b$10$Y7ftGrj4Jv4VNkwLm89JbuCyF.y3Z4FMPuHFthluGKNXBr48d/oiq", // candela2024
            name: "Candela Owner",
            role: "ADMIN",
          },
        });
      }

      // Ensure products seeded if empty
      const count = await prisma.product.count();
      if (count === 0) {
        console.log("⚡ Seeding catalog into fresh database...");
        for (const p of STATIC_PRODUCTS) {
          await prisma.product.create({
            data: {
              name: p.name,
              slug: p.slug,
              description: p.description,
              price: p.price,
              category: p.category,
              subcategory: p.subcategory,
              image: p.image,
              inStock: p.inStock,
              isFeatured: p.isFeatured,
            },
          }).catch(() => {});
        }
      }
    } catch (seedErr) {
      console.warn("DB seed check warning:", seedErr);
    }
  })();

  return globalForPrisma.dbReadyPromise;
}
