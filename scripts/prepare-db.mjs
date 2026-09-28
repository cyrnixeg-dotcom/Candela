import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export function setCandelaSchema(url) {
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

// Parse .env if keys not already present in process.env
const envPath = path.join(process.cwd(), ".env");
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_NEON_POSTGRES_URL;
}

// Scoped to candela schema
if (process.env.POSTGRES_PRISMA_URL) {
  process.env.POSTGRES_PRISMA_URL = setCandelaSchema(process.env.POSTGRES_PRISMA_URL);
}
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = setCandelaSchema(process.env.DATABASE_URL);
}
if (process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL_NON_POOLING = setCandelaSchema(process.env.POSTGRES_URL_NON_POOLING);
}
if (process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL_UNPOOLED = setCandelaSchema(process.env.DATABASE_URL_UNPOOLED);
}
if (process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = setCandelaSchema(process.env.POSTGRES_URL);
}

// Sync back to .env
const keysToSync = [
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
];
for (const key of keysToSync) {
  if (process.env[key]) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}="${process.env[key]}"`);
    } else {
      envContent += `\n${key}="${process.env[key]}"`;
    }
  }
}
fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

console.log("⚡ Configuring Prisma for persistent PostgreSQL on Neon (schema=candela)...");

const postgresDatasource = process.env.POSTGRES_PRISMA_URL
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
fs.writeFileSync(schemaPath, schema, "utf-8");

// Generate Prisma Client
console.log("⚡ Generating Prisma Client for PostgreSQL...");
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

console.log("⚡ Synchronizing schema with PostgreSQL database (schema=candela)...");
try {
  execSync("npx prisma db push", { stdio: "inherit", env: process.env });
  console.log("✅ PostgreSQL schema synchronized successfully in candela schema.");
} catch (err) {
  console.warn("⚠️ Warning: prisma db push failed (remote database may be initializing). Proceeding with build.", err?.message);
}
