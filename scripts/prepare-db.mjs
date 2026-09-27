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

const hasPostgresPrismaUrl = Boolean(process.env.POSTGRES_PRISMA_URL);
const isPostgres = Boolean(
  hasPostgresPrismaUrl ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:"))
);

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

if (isPostgres) {
  console.log("⚡ Detected PostgreSQL environment. Configuring Prisma for isolated 'candela' schema on Neon...");

  // Apply isolated candela schema to prevent table collisions with other databases/projects
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

  // Ensure .env has these scoped URLs so Prisma CLI subcommands load schema=candela
  const envPath = path.join(process.cwd(), ".env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
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
execSync("npx prisma generate", { stdio: "inherit", env: process.env });

if (isPostgres) {
  console.log("⚡ Synchronizing schema with PostgreSQL database (schema=candela)...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
    console.log("✅ PostgreSQL schema synchronized successfully in candela schema.");
  } catch (err) {
    console.warn("⚠️ Warning: prisma db push failed (remote database may be initializing). Proceeding with build.", err?.message);
  }
}
