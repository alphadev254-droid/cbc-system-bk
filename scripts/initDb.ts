/**
 * scripts/initDb.ts
 *
 * Run manually:  npm run db:init
 *
 * What it does:
 *  - Connects to PostgreSQL
 *  - Imports all models (triggers association setup via models/index.ts)
 *  - Runs sequelize.sync({ force: false, alter: false }) in production
 *  - Runs sequelize.sync({ alter: true }) in development
 *
 * Use force:true ONLY to wipe and recreate all tables (destructive):
 *  npm run db:init -- --force
 *
 * WARNING: --force drops all existing data. Never use in production.
 */

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../src/config/database';
import logger from '../src/config/logger';

// Import models index to register all models + associations
import '../src/models/index';

const isForce = process.argv.includes('--force');
const isDev   = process.env.NODE_ENV === 'development';

const run = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('[InitDB] Database connected');

    if (isForce) {
      logger.warn('[InitDB] --force flag detected — dropping and recreating all tables');
      await sequelize.sync({ force: true });
      logger.info('[InitDB] All tables dropped and recreated');
    } else if (isDev) {
      // alter:true — adds missing columns/indexes without dropping data
      await sequelize.sync({ alter: true });
      logger.info('[InitDB] Tables synced with alter:true (development)');
    } else {
      // Production — safe sync, only creates tables that don't exist yet
      await sequelize.sync({ force: false });
      logger.info('[InitDB] Tables synced (production safe)');
    }

    logger.info('[InitDB] Completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('[InitDB] Failed:', err);
    process.exit(1);
  }
};

run();
