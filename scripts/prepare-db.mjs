import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const hasPostgresPrismaUrl = Boolean(process.env.POSTGRES_PRISMA_URL);
const isPostgres = Boolean(
  hasPostgresPrismaUrl ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:"))
);

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

if (isPostgres) {
  console.log("⚡ Detected PostgreSQL environment. Configuring Prisma for PostgreSQL (Neon)...");
  const postgresDatasource = hasPostgresPrismaUrl
    ? `datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}`
    : `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`;

  schema = schema.replace(/datasource\s+db\s*\{[\s\S]*?\}/, postgresDatasource);
} else {
  console.log("⚡ PostgreSQL not detected. Configuring Prisma for SQLite fallback...");
  schema = schema.replace(
    /datasource\s+db\s*\{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
}

fs.writeFileSync(schemaPath, schema, "utf-8");

// Generate Prisma Client
console.log("⚡ Generating Prisma Client...");
execSync("npx prisma generate", { stdio: "inherit" });

if (isPostgres) {
  console.log("⚡ Synchronizing schema with PostgreSQL database...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("✅ PostgreSQL schema synchronized successfully.");
  } catch (err) {
    console.warn("⚠️ Warning: prisma db push failed (remote database may be initializing). Proceeding with build.", err?.message);
  }
}
