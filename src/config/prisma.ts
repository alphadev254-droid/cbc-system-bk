// src/config/prisma.ts
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "mariadb";

/**
 * Build a mariadb PoolConfig from DATABASE_URL.
 * Passing the raw string into PrismaMariaDb often fails: the driver's URI parser is
 * stricter than Prisma's, and quoted values in .env can break parsing.
 */
function databaseUrlToPoolConfig(raw: string): PoolConfig {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) {
    throw new Error("DATABASE_URL is empty");
  }

  // WHATWG URL only treats a few schemes as hierarchical; mysql/mariadb are not.
  // Reuse the HTTP parser for userinfo + host + port + path.
  const normalized = trimmed
    .replace(/^mysql:\/\//i, "http://")
    .replace(/^mariadb:\/\//i, "http://");

  let u: URL;
  try {
    u = new URL(normalized);
  } catch {
    throw new Error(
      "Invalid DATABASE_URL. Use mysql://user:password@host:port/database_name — special characters in user/password must be percent-encoded."
    );
  }

  const database = u.pathname.replace(/^\//, "").split("/")[0];
  if (!database) {
    throw new Error(
      'DATABASE_URL must include a database name, e.g. mysql://root@localhost:3306/cbc_platform'
    );
  }

  const port = u.port ? parseInt(u.port, 10) : 3306;

  return {
    host: u.hostname,
    port,
    user: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    database,
    connectionLimit: 5,
  };
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaMariaDb(databaseUrlToPoolConfig(databaseUrl));

export const prisma = new PrismaClient({ adapter });
export default prisma;
