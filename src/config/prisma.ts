// @ts-nocheck
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Pool config for @prisma/adapter-mariadb.
 * Supports either:
 * - `DATABASE_URL` (mysql:// or mariadb://) with database in the path — same as Prisma CLI / migrate
 * - or explicit `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
 */
function getMariaDbPoolConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectTimeoutMs: number;
} {
  const explicitDb = process.env.DB_NAME?.trim();
  if (explicitDb) {
    return {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: explicitDb,
      connectTimeoutMs: 5_000,
    };
  }

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      'Set DATABASE_URL (e.g. mysql://user:pass@localhost:3306/cbc_platform) or DB_HOST / DB_USER / DB_PASSWORD / DB_NAME'
    );
  }

  const normalized = raw.replace(/^mysql:\/\//i, 'http://').replace(/^mariadb:\/\//i, 'http://');
  let u: URL;
  try {
    u = new URL(normalized);
  } catch {
    throw new Error('Invalid DATABASE_URL');
  }

  const database = u.pathname.replace(/^\//, '').split('/')[0];
  if (!database) {
    throw new Error(
      'DATABASE_URL must include a database name in the path, e.g. mysql://root@localhost:3306/cbc_platform'
    );
  }

  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: u.username ? decodeURIComponent(u.username) : 'root',
    password: u.password ? decodeURIComponent(u.password) : '',
    database,
    connectTimeoutMs: 5_000,
  };
}

const cfg = getMariaDbPoolConfig();

const adapter = new PrismaMariaDb({
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  password: cfg.password,
  database: cfg.database,
  connectTimeout: cfg.connectTimeoutMs,
});

export const prisma = new PrismaClient({ adapter });
