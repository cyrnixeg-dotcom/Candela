import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { STATIC_PRODUCTS } from "./data";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbReadyPromise: Promise<void> | undefined;
};

function setCandelaSchema(url: string): string {
  if (!url || typeof url !== "string") return url;
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("schema", "candela");
    return parsed.toString();
  } catch {
    if (url.includes("schema=")) {
      return url.replace(/schema=[^&]+/, "schema=candela");
    }
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}schema=candela`;
  }
}

const DEFAULT_NEON_POSTGRES_URL =
  "postgresql://neondb_owner:npg_LDKW6PZpaw3U@ep-solitary-tooth-avbzpmn7-pooler.c-11.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require&schema=candela";

function getDbUrl(): string {
  // 1. Production pooled connection from Vercel / Neon
  if (process.env.POSTGRES_PRISMA_URL) {
    return setCandelaSchema(process.env.POSTGRES_PRISMA_URL);
  }

  // 2. Standard DATABASE_URL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return setCandelaSchema(process.env.DATABASE_URL);
  }

  // 3. Fallback POSTGRES_URL
  if (process.env.POSTGRES_URL && !process.env.POSTGRES_URL.startsWith("file:")) {
    return setCandelaSchema(process.env.POSTGRES_URL);
  }

  // 4. Guaranteed persistent Neon PostgreSQL Candela database
  return DEFAULT_NEON_POSTGRES_URL;
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

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 600
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || "";
      const isTransient =
        msg.includes("Connection") ||
        msg.includes("connect") ||
        msg.includes("timeout") ||
        msg.includes("closed") ||
        msg.includes("terminated") ||
        msg.includes("Can't reach database") ||
        err?.code === "P1001" ||
        err?.code === "P1002" ||
        err?.code === "P1017";

      if (attempt < maxRetries && isTransient) {
        console.warn(`[Neon DB Retry] Attempt ${attempt} failed with transient error: ${msg}. Retrying in ${delayMs * attempt}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

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
      await withDbRetry(() => prisma.user.findFirst({ select: { id: true } }));
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
      // Ensure at least one admin account exists without overwriting custom passwords/names
      const adminEmail = "admin@candela.store";
      const adminPassHash = "$2b$10$GAVoa682SIg8p.wkntN6fez35sVNeOAlHYduopwuxdrajNzsrEAVG"; // candella@2026
      const existingAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { email: adminEmail },
            { role: "ADMIN" },
          ],
        },
      });

      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            email: adminEmail,
            password: adminPassHash,
            name: "Candela Admin",
            role: "ADMIN",
          },
        });
      } else if (existingAdmin.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: "ADMIN" },
        }).catch(() => {});
      }

      // Ensure all regular users remain USER
      if (existingAdmin) {
        await prisma.user.updateMany({
          where: {
            id: { not: existingAdmin.id },
            role: "ADMIN",
          },
          data: { role: "USER" },
        }).catch(() => {});
      }

      // Ensure products seeded only once on fresh setup
      const isCatalogInit = await prisma.siteSetting.findUnique({
        where: { key: "catalog_seeded" },
      });
      const count = await prisma.product.count();
      if (!isCatalogInit && count === 0) {
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
        await prisma.siteSetting.create({
          data: { key: "catalog_seeded", value: "true" },
        }).catch(() => {});
      }
    } catch (seedErr) {
      console.warn("DB seed check warning:", seedErr);
    }
  })();

  return globalForPrisma.dbReadyPromise;
}
