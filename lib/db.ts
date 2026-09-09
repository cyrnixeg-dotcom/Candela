import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  // If remote PostgreSQL or external URL is provided, use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // If on Vercel / serverless (where root filesystem is read-only)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join("/tmp", "candela-dev.db");
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const bundledDb = path.join(process.cwd(), "prisma", "dev.db");
        if (fs.existsSync(bundledDb)) {
          fs.copyFileSync(bundledDb, tmpDbPath);
          console.log("Successfully copied seed database to /tmp/candela-dev.db");
        }
      }
      return `file:${tmpDbPath}`;
    } catch (err) {
      console.warn("Could not copy SQLite to /tmp:", err);
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
