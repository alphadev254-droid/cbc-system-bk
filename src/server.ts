import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { prisma } from './config/prisma';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection established.');

    app.listen(PORT, () => {
      logger.info(`CBC Platform API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
