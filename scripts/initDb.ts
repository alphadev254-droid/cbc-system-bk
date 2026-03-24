/**
 * scripts/initDb.ts
 *
 * First time setup — creates all tables via Prisma migrations.
 *
 * Usage:
 *   Development (creates migration + applies):  npm run db:migrate
 *   Production  (applies existing migrations):  npm run db:migrate:prod
 *   Reset all tables (destructive!):            npm run db:reset
 *   Open Prisma Studio (GUI):                   npm run db:studio
 *   Regenerate Prisma client after schema change: npm run db:generate
 *
 * Workflow for first run:
 *   1. Set DATABASE_URL in .env
 *   2. npm run db:migrate        ← creates tables
 *   3. npm run seed              ← seeds permissions + system admin
 *   4. npm run dev               ← start server
 *
 * Workflow when you change schema.prisma:
 *   1. Edit prisma/schema.prisma
 *   2. npm run db:migrate        ← creates new migration + applies it
 *   3. npm run db:generate       ← regenerates Prisma client types
 *   4. Restart server
 */

// This file is documentation only.
// Actual migration is handled by the prisma CLI commands in package.json scripts.
// Run: npx prisma migrate dev --name init

import { execSync } from 'child_process';
import logger from '../src/config/logger';

const args    = process.argv.slice(2);
const isForce = args.includes('--force');

try {
  if (isForce) {
    logger.warn('[InitDB] --force: resetting database (all data will be lost)');
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
  } else {
    logger.info('[InitDB] Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('[InitDB] Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
  }
  logger.info('[InitDB] Done');
  process.exit(0);
} catch (err) {
  logger.error('[InitDB] Failed:', err);
  process.exit(1);
}
